import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { childAnalyzer, ChildAnalysis } from '@/lib/ai-analysis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Demo family UUID - in production, this would come from user session
const DEMO_FAMILY_ID = '550e8400-e29b-41d4-a716-446655440000'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const analysisType = url.searchParams.get('type') || 'comprehensive'
    const timeframe = parseInt(url.searchParams.get('days') || '30')

    // Get the most recent active child
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, name, age, current_concerns')
      .eq('family_id', DEMO_FAMILY_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (childError || !child) {
      return NextResponse.json({
        error: 'No active children found',
        analysis: null
      }, { status: 404 })
    }

    // Get conversation history for analysis
    const { data: conversations, error: conversationError } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('child_id', child.id)
      .gte('created_at', new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (conversationError) {
      console.error('Error fetching conversations:', conversationError)
      return NextResponse.json({
        error: 'Failed to fetch conversation data',
        analysis: null
      }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        message: 'No conversation data available for analysis',
        analysis: generateInitialAnalysis(child)
      })
    }

    let analysis: ChildAnalysis

    switch (analysisType) {
      case 'comprehensive':
        analysis = await childAnalyzer.analyzeConversationHistory(child.id, conversations)
        break
      
      case 'progress':
        const progressAnalysis = await childAnalyzer.analyzeProgressOverTime(child.id, timeframe)
        return NextResponse.json({
          type: 'progress',
          child: child,
          analysis: progressAnalysis
        })
      
      case 'solutions':
        const concerns = extractConcernsFromConversations(conversations)
        const solutions = await childAnalyzer.generateParentSolutions(concerns, child.age)
        return NextResponse.json({
          type: 'solutions',
          child: child,
          solutions: solutions
        })
      
      default:
        analysis = await childAnalyzer.analyzeConversationHistory(child.id, conversations)
    }

    // Store analysis results for tracking
    await storeAnalysisResults(child.id, analysis)

    // Generate parent insights
    const parentInsights = generateParentInsights(analysis, child)

    return NextResponse.json({
      type: 'comprehensive',
      child: {
        id: child.id,
        name: child.name,
        age: child.age
      },
      analysis: analysis,
      parentInsights: parentInsights,
      conversationCount: conversations.length,
      analysisTimestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in analysis API:', error)
    return NextResponse.json({
      error: 'Internal server error during analysis',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

function extractConcernsFromConversations(conversations: any[]): string[] {
  const concerns = new Set<string>()
  
  conversations.forEach(conv => {
    const message = conv.user_message?.toLowerCase() || ''
    const moodAnalysis = conv.mood_analysis || {}
    
    // Extract concerns based on conversation content
    if (message.includes('anxious') || message.includes('worried') || moodAnalysis.anxiety > 6) {
      concerns.add('Anxiety management')
    }
    if (message.includes('sad') || message.includes('depressed') || moodAnalysis.sadness > 6) {
      concerns.add('Mood regulation')
    }
    if (message.includes('angry') || message.includes('mad') || moodAnalysis.anger > 6) {
      concerns.add('Anger management')
    }
    if (message.includes('school') || message.includes('teacher')) {
      concerns.add('Academic stress')
    }
    if (message.includes('friend') || message.includes('social')) {
      concerns.add('Social relationships')
    }
    if (message.includes('family') || message.includes('parent')) {
      concerns.add('Family dynamics')
    }
    if (message.includes('sleep') || message.includes('tired')) {
      concerns.add('Sleep concerns')
    }
  })
  
  return Array.from(concerns)
}

async function storeAnalysisResults(childId: string, analysis: ChildAnalysis) {
  try {
    await supabase
      .from('analysis_results')
      .insert({
        child_id: childId,
        analysis_data: analysis,
        risk_level: analysis.overallRiskLevel,
        primary_concerns: analysis.primaryConcerns,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error storing analysis results:', error)
  }
}

function generateParentInsights(analysis: ChildAnalysis, child: any) {
  return {
    riskAssessment: {
      level: analysis.overallRiskLevel,
      description: getRiskDescription(analysis.overallRiskLevel),
      urgency: getRiskUrgency(analysis.overallRiskLevel)
    },
    keyFindings: analysis.primaryConcerns.slice(0, 3),
    immediateActions: analysis.immediateActions.filter(action => action.priority === 'immediate'),
    weeklyFocus: analysis.weeklyGoals.slice(0, 2),
    professionalRecommendation: analysis.therapyRecommendations.length > 0 ? {
      recommended: true,
      urgency: analysis.therapyRecommendations[0].urgency,
      type: analysis.therapyRecommendations[0].type,
      rationale: analysis.therapyRecommendations[0].rationale
    } : {
      recommended: false,
      message: 'Continue current supportive approach'
    },
    progressMetrics: analysis.progressTracking.slice(0, 3),
    nextSteps: generateNextSteps(analysis)
  }
}

function getRiskDescription(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'Your child is showing good emotional stability with normal developmental challenges.'
    case 'moderate':
      return 'Some areas of concern that would benefit from attention and support.'
    case 'high':
      return 'Significant emotional distress requiring immediate attention and professional consultation.'
    case 'crisis':
      return 'Immediate intervention required. Please contact a mental health professional today.'
    default:
      return 'Assessment in progress.'
  }
}

function getRiskUrgency(riskLevel: string): string {
  switch (riskLevel) {
    case 'low':
      return 'Continue current supportive approach'
    case 'moderate':
      return 'Implement recommended strategies within 1-2 weeks'
    case 'high':
      return 'Take action within 24-48 hours'
    case 'crisis':
      return 'Immediate intervention required'
    default:
      return 'Monitor and assess'
  }
}

function generateNextSteps(analysis: ChildAnalysis): string[] {
  const steps = []
  
  if (analysis.immediateActions.length > 0) {
    steps.push(`Implement immediate action: ${analysis.immediateActions[0].title}`)
  }
  
  if (analysis.therapyRecommendations.length > 0) {
    const rec = analysis.therapyRecommendations[0]
    steps.push(`Consider ${rec.type} therapy ${rec.urgency}`)
  }
  
  if (analysis.progressTracking.length > 0) {
    steps.push(`Begin tracking: ${analysis.progressTracking[0].metric}`)
  }
  
  steps.push('Schedule follow-up analysis in 1-2 weeks')
  
  return steps
}

function generateInitialAnalysis(child: any): ChildAnalysis {
  return {
    overallRiskLevel: 'low',
    primaryConcerns: ['Initial assessment needed'],
    behavioralPatterns: [],
    potentialConditions: [],
    symptomSeverity: {
      anxiety: { level: 5, symptoms: [] },
      depression: { level: 5, symptoms: [] },
      adhd: { level: 5, symptoms: [] },
      anger: { level: 5, symptoms: [] },
      trauma: { level: 5, symptoms: [] }
    },
    immediateActions: [{
      priority: 'important',
      category: 'communication',
      title: 'Begin regular emotional check-ins',
      description: 'Start building therapeutic rapport with your child',
      steps: [
        'Have your child complete a therapy session with Dr. Emma',
        'Observe their comfort level and engagement',
        'Ask about their experience afterward'
      ],
      timeframe: 'This week',
      expectedOutcome: 'Baseline assessment and comfort with AI therapy'
    }],
    weeklyGoals: [],
    longTermStrategy: {
      focus: 'Establishing baseline and building trust',
      approach: 'Gentle introduction to emotional expression',
      timeline: '2-4 weeks',
      milestones: ['Comfortable with Dr. Emma', 'Regular session completion'],
      parentSupport: ['Encourage participation', 'Review session summaries'],
      professionalSupport: ['Monitor for concerning patterns']
    },
    therapyRecommendations: [],
    interventionPlan: {
      phase: 'assessment',
      techniques: ['AI-guided conversation', 'Mood tracking'],
      parentInvolvement: ['Weekly review', 'Supportive encouragement'],
      schoolCoordination: [],
      duration: '2-4 weeks initial assessment'
    },
    progressTracking: [{
      metric: 'Session completion rate',
      baseline: 0,
      target: 3,
      timeframe: '1 week',
      trackingMethod: 'Platform monitoring'
    }]
  }
} 