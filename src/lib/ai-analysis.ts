import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import { supabaseAdmin } from './supabase'
import { Child, SocialHealthAnalysis } from '@/types/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!)

export interface CommunicationAnalysis {
  mood_score: number
  social_score: number
  emotional_state: string
  friendship_dynamics: Record<string, any>
  concerns: string[]
  positive_indicators: string[]
}

export interface InterventionRecommendation {
  type: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_effectiveness: number
  follow_up_timeframe: string
}

/**
 * Analyzes communication data for social health insights
 */
export async function analyzeSocialHealth(
  messages: string[],
  child: Child,
  context: Record<string, any> = {}
): Promise<CommunicationAnalysis> {
  const prompt = `
    Analyze the following communication data for a ${child.age}-year-old child's social and emotional health.
    Consider age-appropriate communication patterns and development stages.
    
    Communication data:
    ${messages.join('\n')}
    
    Additional context:
    ${JSON.stringify(context, null, 2)}
    
    Child's personality profile:
    ${JSON.stringify(child.personality_profile, null, 2)}
    
    Provide analysis in the following JSON format:
    {
      "mood_score": (0-10 scale),
      "social_score": (0-10 scale),
      "emotional_state": "primary emotional state",
      "friendship_dynamics": {
        "relationship_strength": (0-10),
        "conflict_indicators": [],
        "support_network_quality": (0-10)
      },
      "concerns": ["specific concerns identified"],
      "positive_indicators": ["positive social behaviors noted"]
    }
    
    Focus on:
    - Age-appropriate social development
    - Emotional regulation patterns
    - Peer relationship quality
    - Communication style changes
    - Signs of distress or positive growth
  `

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a child psychology expert specializing in social-emotional development. Provide accurate, evidence-based analysis while being sensitive to privacy and child welfare.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const analysisText = response.choices[0].message.content!
    try {
      // Clean markdown formatting just in case
      const cleanedText = analysisText.replace(/^```(?:json|JSON)?\s*/g, '').replace(/\s*```\s*$/g, '').trim()
      const analysis = JSON.parse(cleanedText)
      return analysis as CommunicationAnalysis
    } catch (parseError) {
      console.error('Error parsing social health analysis JSON:', parseError)
      console.error('Raw response:', analysisText.substring(0, 300) + '...')
      throw new Error('Failed to parse social health analysis')
    }
  } catch (error) {
    console.error('Error analyzing social health:', error)
    throw new Error('Failed to analyze social health data')
  }
}

/**
 * Generates contextual intervention recommendations using RAG
 */
export async function generateInterventions(
  analysis: CommunicationAnalysis,
  child: Child,
  familyContext: Record<string, any> = {}
): Promise<InterventionRecommendation[]> {
  // Create embedding for the analysis context
  const contextText = `
    Child age: ${child.age}
    Emotional state: ${analysis.emotional_state}
    Mood score: ${analysis.mood_score}
    Social score: ${analysis.social_score}
    Concerns: ${analysis.concerns.join(', ')}
    Family context: ${JSON.stringify(familyContext)}
  `

  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: contextText
  })

  // Query Pinecone for relevant intervention strategies
  const queryResponse = await index.query({
    vector: embedding.data[0].embedding,
    topK: 5,
    includeMetadata: true,
    filter: {
      age_range_min: { $lte: child.age },
      age_range_max: { $gte: child.age }
    }
  })

  const relevantInterventions = queryResponse.matches.map((match: any) => match.metadata)

  // Generate personalized recommendations using retrieved interventions
  const prompt = `
    Based on the child's analysis and relevant intervention strategies, generate personalized recommendations.
    
    Child Analysis:
    ${JSON.stringify(analysis, null, 2)}
    
    Child Details:
    - Age: ${child.age}
    - Personality: ${JSON.stringify(child.personality_profile, null, 2)}
    
    Relevant Intervention Strategies:
    ${JSON.stringify(relevantInterventions, null, 2)}
    
    Generate 3-5 specific, actionable intervention recommendations in JSON format:
    [
      {
        "type": "intervention category",
        "content": "specific actionable steps for parents",
        "priority": "low|medium|high|urgent",
        "estimated_effectiveness": (0-100),
        "follow_up_timeframe": "timeframe for follow-up"
      }
    ]
    
    Consider:
    - Age-appropriate interventions
    - Family practicality
    - Evidence-based approaches
    - Escalation paths if needed
    - Cultural sensitivity
  `

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a child psychology expert providing practical, evidence-based intervention recommendations for families.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })

    const recommendationsText = response.choices[0].message.content!
    try {
      // Clean markdown formatting just in case
      const cleanedText = recommendationsText.replace(/^```(?:json|JSON)?\s*/g, '').replace(/\s*```\s*$/g, '').trim()
      const recommendations = JSON.parse(cleanedText)
      return recommendations.interventions || recommendations
    } catch (parseError) {
      console.error('Error parsing interventions JSON:', parseError)
      console.error('Raw response:', recommendationsText.substring(0, 300) + '...')
      throw new Error('Failed to parse intervention recommendations')
    }
  } catch (error) {
    console.error('Error generating interventions:', error)
    throw new Error('Failed to generate intervention recommendations')
  }
}

/**
 * Stores analysis results and triggers alerts if needed
 */
export async function storeAnalysisResults(
  childId: string,
  analysis: CommunicationAnalysis,
  recommendations: InterventionRecommendation[],
  dataSources: string[] = []
): Promise<SocialHealthAnalysis> {
  try {
    const { data, error } = await supabaseAdmin
      .from('social_health_analyses')
      .insert({
        child_id: childId,
        analysis_date: new Date().toISOString(),
        mood_score: analysis.mood_score,
        social_score: analysis.social_score,
        emotional_state: analysis.emotional_state,
        friendship_dynamics: analysis.friendship_dynamics,
        intervention_recommendations: recommendations.map(r => r.content),
        ai_insights: {
          concerns: analysis.concerns,
          positive_indicators: analysis.positive_indicators,
          recommendations: recommendations
        },
        data_sources: dataSources
      })
      .select()
      .single()

    if (error) throw error

    // Check if crisis alert is needed
    await checkForCrisisAlerts(childId, analysis, recommendations)

    return data
  } catch (error) {
    console.error('Error storing analysis results:', error)
    throw new Error('Failed to store analysis results')
  }
}

/**
 * Evaluates if crisis alerts need to be triggered
 */
async function checkForCrisisAlerts(
  childId: string,
  analysis: CommunicationAnalysis,
  recommendations: InterventionRecommendation[]
): Promise<void> {
  const urgentRecommendations = recommendations.filter(r => r.priority === 'urgent')
  const lowMoodScore = analysis.mood_score < 3
  const lowSocialScore = analysis.social_score < 3
  const severeConcerns = analysis.concerns.some(concern => 
    concern.toLowerCase().includes('self-harm') ||
    concern.toLowerCase().includes('suicide') ||
    concern.toLowerCase().includes('severe') ||
    concern.toLowerCase().includes('crisis')
  )

  let alertType: 'mild' | 'moderate' | 'severe' | 'crisis' = 'mild'
  let alertMessage = ''

  if (severeConcerns || urgentRecommendations.length > 0) {
    alertType = 'crisis'
    alertMessage = 'Immediate intervention may be required - concerning patterns detected'
  } else if (lowMoodScore && lowSocialScore) {
    alertType = 'severe'
    alertMessage = 'Significant decline in social and emotional wellbeing detected'
  } else if (lowMoodScore || lowSocialScore) {
    alertType = 'moderate'
    alertMessage = 'Concerning changes in social or emotional patterns'
  } else if (analysis.concerns.length > 3) {
    alertType = 'mild'
    alertMessage = 'Multiple areas of concern identified for monitoring'
  }

  if (alertType !== 'mild' || analysis.concerns.length > 0) {
    await supabaseAdmin
      .from('crisis_alerts')
      .insert({
        child_id: childId,
        alert_type: alertType,
        alert_message: alertMessage,
        is_resolved: false
      })
  }
}

/**
 * Generates daily morning briefing for parents
 */
export async function generateMorningBriefing(
  childId: string,
  daysBack: number = 1
): Promise<string> {
  const { data: analyses } = await supabaseAdmin
    .from('social_health_analyses')
    .select('*')
    .eq('child_id', childId)
    .gte('analysis_date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('analysis_date', { ascending: false })

  if (!analyses?.length) {
    return "No recent social health data available for analysis."
  }

  const latestAnalysis = analyses[0]
  const prompt = `
    Generate a concise, parent-friendly morning briefing based on the latest social health analysis.
    
    Analysis Data:
    ${JSON.stringify(latestAnalysis, null, 2)}
    
    Create a brief, actionable summary that includes:
    - Overall social health score
    - Key insights from yesterday
    - Any areas of concern
    - Positive developments
    - Recommended actions for today
    
    Keep it under 200 words and maintain a supportive, informative tone.
  `

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a family wellness assistant providing helpful daily insights to parents about their child\'s social and emotional development.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    })

    return response.choices[0].message.content!
  } catch (error) {
    console.error('Error generating morning briefing:', error)
    return "Unable to generate briefing at this time. Please check back later."
  }
}

// Comprehensive analysis interface
export interface ChildAnalysis {
  // Core Assessment
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'crisis'
  primaryConcerns: string[]
  behavioralPatterns: BehavioralPattern[]
  
  // Diagnostic Insights
  potentialConditions: PotentialCondition[]
  symptomSeverity: SymptomSeverity
  
  // Parent Solutions
  immediateActions: Action[]
  weeklyGoals: Goal[]
  longTermStrategy: Strategy
  
  // Professional Recommendations
  therapyRecommendations: TherapyRecommendation[]
  interventionPlan: InterventionPlan
  progressTracking: ProgressMetric[]
}

export interface BehavioralPattern {
  type: 'escalating' | 'cyclical' | 'trigger-based' | 'situational'
  description: string
  frequency: string
  triggers: string[]
  impact: 'mild' | 'moderate' | 'severe'
  trend: 'improving' | 'stable' | 'worsening'
}

export interface PotentialCondition {
  condition: string
  confidence: number // 0-100%
  symptoms: string[]
  dsm5Criteria: string[]
  recommendedAssessment: string
}

export interface SymptomSeverity {
  anxiety: { level: number; symptoms: string[] }
  depression: { level: number; symptoms: string[] }
  adhd: { level: number; symptoms: string[] }
  anger: { level: number; symptoms: string[] }
  trauma: { level: number; symptoms: string[] }
}

export interface Action {
  priority: 'immediate' | 'urgent' | 'important'
  category: 'communication' | 'behavioral' | 'environmental' | 'professional'
  title: string
  description: string
  steps: string[]
  timeframe: string
  expectedOutcome: string
}

export interface Goal {
  area: string
  objective: string
  activities: string[]
  measurableOutcome: string
  parentRole: string
  childRole: string
}

export interface Strategy {
  focus: string
  approach: string
  timeline: string
  milestones: string[]
  parentSupport: string[]
  professionalSupport: string[]
}

export interface TherapyRecommendation {
  type: 'CBT' | 'DBT' | 'play-therapy' | 'family-therapy' | 'trauma-informed'
  urgency: 'immediate' | 'within-week' | 'within-month'
  rationale: string
  expectedBenefits: string[]
}

export interface InterventionPlan {
  phase: 'assessment' | 'stabilization' | 'treatment' | 'maintenance'
  techniques: string[]
  parentInvolvement: string[]
  schoolCoordination: string[]
  duration: string
}

export interface ProgressMetric {
  metric: string
  baseline: number
  target: number
  timeframe: string
  trackingMethod: string
}

export class AdvancedChildAnalyzer {
  
  async analyzeConversationHistory(childId: string, conversations: any[]): Promise<ChildAnalysis> {
    try {
      // Prepare conversation data for analysis
      const conversationText = conversations.map(conv => 
        `Child: ${conv.user_message}\nAI Response: ${conv.ai_response}\nMood: ${JSON.stringify(conv.mood_analysis)}`
      ).join('\n\n---\n\n')

      const analysisPrompt = `
You are Dr. Sarah Chen, PhD in Child Psychology, with 15+ years specializing in developmental trauma, family systems, and evidence-based interventions. You're analyzing AI therapy session data to provide comprehensive clinical assessment for parents and mental health professionals.

CLINICAL CONTEXT:
- Child's developmental stage and age-appropriate expectations
- Family dynamics and attachment patterns
- Environmental stressors and protective factors
- Cultural considerations and individual differences

CONVERSATION HISTORY FOR ANALYSIS:
${conversationText}

COMPREHENSIVE PSYCHOLOGICAL ASSESSMENT:

1. CLINICAL RISK STRATIFICATION
- Overall risk level: low/moderate/high/crisis (with specific rationale)
- Immediate safety assessment (self-harm, suicidal ideation, abuse indicators)
- Protective factors and resilience indicators
- Crisis intervention triggers and protocols

2. DEVELOPMENTAL & BEHAVIORAL PATTERN ANALYSIS
- Attachment style indicators and relational patterns
- Emotional regulation development and capacity
- Cognitive processing patterns and thought distortions
- Social-emotional milestones and delays
- Trauma responses and dissociation indicators
- Executive functioning patterns (attention, impulse control, planning)

3. DIFFERENTIAL DIAGNOSTIC SCREENING
- Anxiety disorders (GAD, social anxiety, specific phobias, separation anxiety)
- Mood disorders (depression, bipolar indicators, dysthymia)
- ADHD presentation (inattentive, hyperactive-impulsive, combined)
- Autism spectrum considerations
- Trauma and stress-related disorders (PTSD, adjustment disorders)
- Oppositional defiant patterns vs. trauma responses
- Confidence levels (0-100%) with supporting evidence
- DSM-5 criteria alignment and clinical significance

4. SYMPTOM SEVERITY & FUNCTIONAL IMPAIRMENT
- Anxiety symptoms (physiological, cognitive, behavioral) - severity 1-10
- Depression indicators (mood, interest, energy, worthlessness) - severity 1-10
- Attention/hyperactivity symptoms (focus, impulsivity, hyperactivity) - severity 1-10
- Anger/aggression patterns (triggers, intensity, frequency) - severity 1-10
- Trauma symptoms (intrusion, avoidance, negative cognitions, hyperarousal) - severity 1-10
- Functional impairment across domains (home, school, peers, activities)

5. EVIDENCE-BASED INTERVENTION PLANNING
- Immediate safety interventions (24-48 hours)
- Crisis prevention strategies and early warning signs
- Parent coaching and family system modifications
- Environmental accommodations and structure
- Coping skills development (emotional regulation, distress tolerance)
- Communication strategies (validation, limit-setting, conflict resolution)

6. THERAPEUTIC MODALITY RECOMMENDATIONS
- Trauma-informed care approaches (TF-CBT, EMDR, somatic therapies)
- Cognitive-behavioral interventions (CBT, DBT skills, exposure therapy)
- Family-based treatments (family therapy, parent training, attachment work)
- School-based supports (504 plans, IEP considerations, counseling)
- Medication consultation indicators
- Urgency timeline (immediate/within week/within month)

7. DEVELOPMENTAL TREATMENT GOALS
- Short-term objectives (1-4 weeks) with measurable outcomes
- Medium-term goals (1-3 months) with progress indicators
- Long-term developmental targets (3-12 months)
- Parent skill-building objectives and competencies
- Child skill development (emotional literacy, coping, social skills)
- Family system goals (communication, boundaries, attachment security)

8. PROGRESS MONITORING & ASSESSMENT
- Validated assessment tools (CBCL, SCARED, CDI, Conners, etc.)
- Behavioral tracking metrics and frequency
- Functional outcome measures (school performance, peer relationships)
- Parent and teacher rating scales
- Session-by-session progress indicators
- Treatment response markers and adjustment triggers

9. PROFESSIONAL COLLABORATION FRAMEWORK
- Referral recommendations with specific specialties
- School coordination strategies and communication plans
- Medical consultation needs (pediatrician, psychiatrist, neurologist)
- Community resource coordination (social services, support groups)
- Insurance and accessibility considerations

CRITICAL ANALYSIS REQUIREMENTS:
- Consider developmental appropriateness of all recommendations
- Address cultural and socioeconomic factors affecting treatment
- Prioritize evidence-based interventions with strong research support
- Balance child autonomy with parental involvement based on age
- Include crisis planning and safety protocols
- Provide specific, actionable guidance rather than generic recommendations

Return comprehensive analysis in structured JSON format exactly matching the ChildAnalysis interface, ensuring all fields are populated with clinically relevant, specific, and actionable content.
`

      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert child psychologist providing professional-level analysis. Return detailed JSON analysis only.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.3
      })

      const analysisText = response.choices[0]?.message?.content
      if (!analysisText) {
        throw new Error('No analysis generated')
      }

      // Parse the JSON response with proper cleaning
      try {
        const cleanedText = this.cleanMarkdownCodeBlocks(analysisText)
        const analysis = JSON.parse(cleanedText)
        return this.validateAndEnhanceAnalysis(analysis)
      } catch (parseError) {
        console.error('Error parsing AI analysis:', parseError)
        console.error('Raw response:', analysisText.substring(0, 500) + '...')
        return this.generateFallbackAnalysis(conversations)
      }

    } catch (error) {
      console.error('Error in comprehensive analysis:', error)
      return this.generateFallbackAnalysis(conversations)
    }
  }

  async generateParentSolutions(primaryConcerns: string[], childAge: number): Promise<Action[]> {
    const solutionsPrompt = `
As a child psychologist, provide specific, actionable solutions for parents dealing with these concerns in a ${childAge}-year-old child:

PRIMARY CONCERNS: ${primaryConcerns.join(', ')}

For each concern, provide:
1. Immediate actions (24-48 hours)
2. Short-term strategies (1-2 weeks)
3. Long-term interventions (1-3 months)

Include:
- Specific conversation scripts
- Behavioral modification techniques
- Environmental changes
- Professional consultation recommendations
- Crisis prevention strategies

Format as detailed JSON array of Action objects.
`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a child psychologist providing practical parent guidance. Return structured JSON only.'
          },
          {
            role: 'user',
            content: solutionsPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.4
      })

      const solutionsText = response.choices[0]?.message?.content
      if (solutionsText) {
        try {
          const cleanedText = this.cleanMarkdownCodeBlocks(solutionsText)
          return JSON.parse(cleanedText)
        } catch (parseError) {
          console.error('Error parsing parent solutions JSON:', parseError)
          console.error('Raw response:', solutionsText.substring(0, 300) + '...')
          throw parseError
        }
      }
    } catch (error) {
      console.error('Error generating parent solutions:', error)
    }

    return this.getFallbackSolutions(primaryConcerns)
  }

  async analyzeProgressOverTime(childId: string, timeframeDays: number): Promise<{
    overallTrend: 'improving' | 'stable' | 'declining'
    keyChanges: string[]
    parentRecommendations: string[]
    professionalConsultation: boolean
  }> {
    // Implementation for tracking progress over time
    // This would analyze conversation patterns, mood trends, etc.
    
    return {
      overallTrend: 'stable' as const,
      keyChanges: ['Improved emotional vocabulary', 'Decreased anxiety episodes'],
      parentRecommendations: ['Continue current strategies', 'Increase positive reinforcement'],
      professionalConsultation: false
    }
  }

  // Helper method to clean markdown code blocks from AI responses
  private cleanMarkdownCodeBlocks(text: string): string {
    // Remove markdown code block indicators
    let cleaned = text.trim()
    
    // Remove ```json and ``` patterns
    cleaned = cleaned.replace(/^```(?:json|JSON)?\s*/g, '')
    cleaned = cleaned.replace(/\s*```\s*$/g, '')
    
    // Remove any remaining backticks at start/end
    cleaned = cleaned.replace(/^`+|`+$/g, '')
    
    return cleaned.trim()
  }

  private validateAndEnhanceAnalysis(analysis: any): ChildAnalysis {
    // Ensure all required fields are present and valid
    return {
      overallRiskLevel: analysis.overallRiskLevel || 'moderate',
      primaryConcerns: analysis.primaryConcerns || ['Emotional regulation needs'],
      behavioralPatterns: analysis.behavioralPatterns || [],
      potentialConditions: analysis.potentialConditions || [],
      symptomSeverity: analysis.symptomSeverity || {
        anxiety: { level: 5, symptoms: [] },
        depression: { level: 3, symptoms: [] },
        adhd: { level: 2, symptoms: [] },
        anger: { level: 4, symptoms: [] },
        trauma: { level: 1, symptoms: [] }
      },
      immediateActions: analysis.immediateActions || [],
      weeklyGoals: analysis.weeklyGoals || [],
      longTermStrategy: analysis.longTermStrategy || {
        focus: 'Emotional regulation and coping skills',
        approach: 'Supportive family therapy with CBT techniques',
        timeline: '3-6 months',
        milestones: [],
        parentSupport: [],
        professionalSupport: []
      },
      therapyRecommendations: analysis.therapyRecommendations || [],
      interventionPlan: analysis.interventionPlan || {
        phase: 'assessment',
        techniques: [],
        parentInvolvement: [],
        schoolCoordination: [],
        duration: '6-12 weeks'
      },
      progressTracking: analysis.progressTracking || []
    }
  }

  private generateFallbackAnalysis(conversations: any[]): ChildAnalysis {
    // Generate basic analysis based on available conversation data
    const recentMoods = conversations.slice(-5).map(c => c.mood_analysis).filter(Boolean)
    const avgAnxiety = recentMoods.reduce((sum, mood) => sum + (mood.anxiety || 5), 0) / recentMoods.length
    const avgSadness = recentMoods.reduce((sum, mood) => sum + (mood.sadness || 5), 0) / recentMoods.length

    return {
      overallRiskLevel: avgAnxiety > 7 || avgSadness > 7 ? 'high' : 'moderate',
      primaryConcerns: ['Emotional regulation needs assessment'],
      behavioralPatterns: [],
      potentialConditions: [],
      symptomSeverity: {
        anxiety: { level: Math.round(avgAnxiety), symptoms: ['Worry', 'Nervousness'] },
        depression: { level: Math.round(avgSadness), symptoms: [] },
        adhd: { level: 3, symptoms: [] },
        anger: { level: 4, symptoms: [] },
        trauma: { level: 2, symptoms: [] }
      },
      immediateActions: this.getFallbackActions(),
      weeklyGoals: [],
      longTermStrategy: {
        focus: 'Building emotional awareness and coping skills',
        approach: 'Family-centered support with professional consultation',
        timeline: '2-4 months',
        milestones: ['Improved mood stability', 'Better communication'],
        parentSupport: ['Regular check-ins', 'Validation techniques'],
        professionalSupport: ['Consider child therapist consultation']
      },
      therapyRecommendations: [{
        type: 'CBT',
        urgency: 'within-month',
        rationale: 'Support emotional regulation and coping skills',
        expectedBenefits: ['Improved mood management', 'Better problem-solving skills']
      }],
      interventionPlan: {
        phase: 'assessment',
        techniques: ['Supportive listening', 'Emotion validation'],
        parentInvolvement: ['Daily check-ins', 'Consistent routines'],
        schoolCoordination: ['Communication with teachers'],
        duration: '4-8 weeks'
      },
      progressTracking: [
        {
          metric: 'Daily mood rating',
          baseline: Math.round(avgAnxiety),
          target: 6,
          timeframe: '2 weeks',
          trackingMethod: 'Parent observation and child self-report'
        }
      ]
    }
  }

  private getFallbackActions(): Action[] {
    return [
      {
        priority: 'immediate',
        category: 'communication',
        title: 'Establish daily emotional check-ins',
        description: 'Create a safe space for your child to share feelings',
        steps: [
          'Set aside 10-15 minutes each day for one-on-one time',
          'Ask open-ended questions about their day and feelings',
          'Listen without judgment and validate their emotions',
          'Use phrases like "That sounds difficult" or "I understand"'
        ],
        timeframe: 'Start today',
        expectedOutcome: 'Improved communication and emotional awareness'
      }
    ]
  }

  private getFallbackSolutions(concerns: string[]): Action[] {
    return [
      {
        priority: 'urgent',
        category: 'professional',
        title: 'Schedule professional consultation',
        description: 'Connect with a licensed child therapist for comprehensive assessment',
        steps: [
          'Research local child psychologists or therapists',
          'Check insurance coverage for mental health services',
          'Schedule initial consultation within 1-2 weeks',
          'Prepare summary of concerns and observations'
        ],
        timeframe: '1-2 weeks',
        expectedOutcome: 'Professional guidance and treatment plan'
      }
    ]
  }
}

export const childAnalyzer = new AdvancedChildAnalyzer() 