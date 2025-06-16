import fs from 'fs'
import path from 'path'

interface TherapeuticGuidance {
  frameworks: string
  diagnostics: string
  emotionalLiteracy: string
  bestPractices: string
  crisisIntervention: string
  ageAppropriate: string
}

class EmbeddedTherapeuticKnowledge {
  private static instance: EmbeddedTherapeuticKnowledge
  private knowledge: TherapeuticGuidance | null = null
  private isLoaded = false

  private constructor() {}

  static getInstance(): EmbeddedTherapeuticKnowledge {
    if (!EmbeddedTherapeuticKnowledge.instance) {
      EmbeddedTherapeuticKnowledge.instance = new EmbeddedTherapeuticKnowledge()
    }
    return EmbeddedTherapeuticKnowledge.instance
  }

  // Load and parse the therapeutic knowledge base
  async loadKnowledgeBase(): Promise<void> {
    if (this.isLoaded && this.knowledge) {
      return // Already loaded
    }

    try {
      const filePath = path.join(process.cwd(), 'Therapeutic Chatbot Knowledge Base for Children.md')
      
      if (!fs.existsSync(filePath)) {
        console.warn('⚠️ Therapeutic knowledge base file not found, using fallback knowledge')
        this.knowledge = this.getFallbackKnowledge()
        this.isLoaded = true
        return
      }

      const markdownContent = fs.readFileSync(filePath, 'utf-8')
      this.knowledge = this.parseKnowledgeContent(markdownContent)
      this.isLoaded = true
      
      console.log('✅ Therapeutic knowledge base loaded and embedded into AI system')
    } catch (error) {
      console.error('Error loading therapeutic knowledge base:', error)
      this.knowledge = this.getFallbackKnowledge()
      this.isLoaded = true
    }
  }

  // Parse the markdown content into structured therapeutic guidance
  private parseKnowledgeContent(content: string): TherapeuticGuidance {
    const sections = content.split(/^##\s+(.+)$/gm)
    
    let frameworks = ''
    let diagnostics = ''
    let emotionalLiteracy = ''
    let bestPractices = ''
    let crisisIntervention = ''
    let ageAppropriate = ''

    for (let i = 1; i < sections.length; i += 2) {
      const sectionTitle = sections[i].trim().toLowerCase()
      const sectionContent = sections[i + 1]?.trim() || ''

      if (sectionTitle.includes('therapeutic frameworks')) {
        frameworks = this.extractKeyGuidance(sectionContent, 'frameworks')
      } else if (sectionTitle.includes('diagnostic')) {
        diagnostics = this.extractKeyGuidance(sectionContent, 'diagnostics')
      } else if (sectionTitle.includes('emotional literacy')) {
        emotionalLiteracy = this.extractKeyGuidance(sectionContent, 'emotional-literacy')
      } else if (sectionTitle.includes('best practices')) {
        bestPractices = this.extractKeyGuidance(sectionContent, 'best-practices')
      }
    }

    // Extract crisis intervention and age-appropriate guidance from multiple sections
    crisisIntervention = this.extractCrisisGuidance(content)
    ageAppropriate = this.extractAgeGuidance(content)

    return {
      frameworks,
      diagnostics,
      emotionalLiteracy,
      bestPractices,
      crisisIntervention,
      ageAppropriate
    }
  }

  // Extract key therapeutic guidance from content
  private extractKeyGuidance(content: string, category: string): string {
    const lines = content.split('\n')
    const keyPoints: string[] = []

    lines.forEach(line => {
      const trimmed = line.trim()
      
      // Extract important therapeutic techniques and principles
      if (trimmed.includes('CBT') || trimmed.includes('cognitive behavioral')) {
        keyPoints.push('- Use CBT techniques: Help children identify "thought mistakes" and gently challenge negative thoughts with simple questions')
      }
      if (trimmed.includes('play therapy') || trimmed.includes('"I wonder"')) {
        keyPoints.push('- Apply play therapy principles: Use "I wonder" statements instead of direct questions to invite sharing without pressure')
      }
      if (trimmed.includes('trauma-informed')) {
        keyPoints.push('- Maintain trauma-informed approach: Avoid blame, focus on underlying feelings and safety, respond to emotions beneath behaviors')
      }
      if (trimmed.includes('attachment')) {
        keyPoints.push('- Build secure attachment: Provide consistent warmth, emotional availability, and reliable responses')
      }
      if (trimmed.includes('emotion coaching')) {
        keyPoints.push('- Use emotion coaching: Recognize feelings, label them, validate them, then guide problem-solving')
      }
      if (trimmed.includes('validation')) {
        keyPoints.push('- Provide validation: Acknowledge and normalize all feelings while teaching regulation techniques')
      }
      if (trimmed.includes('mindfulness') || trimmed.includes('breathing')) {
        keyPoints.push('- Teach coping skills: Use breathing exercises, grounding techniques, and mindfulness practices')
      }
    })

    return keyPoints.join('\n')
  }

  // Extract crisis intervention guidance
  private extractCrisisGuidance(content: string): string {
    return `CRISIS INTERVENTION PROTOCOLS:
- Immediately assess safety if child mentions self-harm, suicidal thoughts, abuse, or severe symptoms
- Use calm, supportive language: "I'm really concerned about what you shared. You're brave for telling me."
- Provide immediate resources: Crisis Text Line (741741), National Suicide Prevention Lifeline (988)
- Encourage contacting trusted adults: parents, school counselors, or other safe people
- Document concerning content for professional follow-up
- Never minimize or dismiss crisis situations
- Focus on safety planning and support systems activation`
  }

  // Extract age-appropriate guidance
  private extractAgeGuidance(content: string): string {
    return `AGE-APPROPRIATE THERAPEUTIC APPROACHES:

YOUNG CHILDREN (4-8 years):
- Use simple language and short sentences
- Focus on basic emotions (happy, sad, mad, scared)
- Employ play-based approaches and storytelling
- Use concrete suggestions (deep breathing, counting to ten)
- Be more playful and use metaphors ("feelings like stormy clouds")

PRETEENS (9-12 years):
- Introduce broader emotional vocabulary and mixed feelings
- Use emotion wheels and feelings charts
- Employ emoji-based check-ins for engagement
- Discuss cause-effect relationships more directly
- Balance respect with age-appropriate language

TEENAGERS (11-17 years):
- Treat respectfully, avoid overly childish language
- Explain concepts more thoroughly (anxiety as "brain's alarm system")
- Focus on independence and self-efficacy building
- Use more sophisticated emotional processing techniques
- Support identity development and future planning`
  }

  // Fallback knowledge if file not available
  private getFallbackKnowledge(): TherapeuticGuidance {
    return {
      frameworks: `- Use supportive, validating responses
- Apply active listening and reflection techniques
- Focus on emotional regulation and coping skills
- Maintain trauma-informed, attachment-based approach`,
      
      diagnostics: `- Monitor mood patterns (anxiety, depression, stress)
- Watch for behavioral changes and emotional dysregulation
- Identify triggers and environmental factors
- Assess functioning across domains (home, school, peers)`,
      
      emotionalLiteracy: `- Help children name and understand their feelings
- Expand emotional vocabulary appropriately for age
- Teach emotional regulation techniques
- Normalize all feelings while teaching healthy expression`,
      
      bestPractices: `- Use warm, non-judgmental communication
- Ask open-ended questions and "I wonder" statements
- Provide consistent, patient responses
- Celebrate efforts and validate experiences
- Focus on the child's strengths and resilience`,
      
      crisisIntervention: `- Assess for safety concerns immediately
- Provide crisis resources and encourage help-seeking
- Contact trusted adults when necessary
- Use de-escalation and emotional stabilization techniques`,
      
      ageAppropriate: `- Adjust language complexity based on developmental stage
- Use age-appropriate metaphors and examples
- Consider cognitive and emotional developmental capacity
- Balance playfulness with respect for maturity level`
    }
  }

  // Get comprehensive therapeutic context for AI system
  getTherapeuticContext(childAge?: number, concerns?: string[], messageContent?: string): string {
    if (!this.knowledge) {
      return ''
    }

    let context = `INTEGRATED THERAPEUTIC KNOWLEDGE BASE:

CORE THERAPEUTIC FRAMEWORKS:
${this.knowledge.frameworks}

CLINICAL AWARENESS:
${this.knowledge.diagnostics}

EMOTIONAL LITERACY GUIDANCE:
${this.knowledge.emotionalLiteracy}

COMMUNICATION BEST PRACTICES:
${this.knowledge.bestPractices}

${this.knowledge.crisisIntervention}

${this.knowledge.ageAppropriate}

CONTEXTUAL GUIDANCE FOR THIS INTERACTION:`

    // Add age-specific guidance
    if (childAge) {
      if (childAge <= 8) {
        context += `
- Child is 4-8 years old: Use simple language, play-based approaches, basic emotions, concrete suggestions
- Employ storytelling, metaphors, and playful interactions
- Keep explanations short and use visual/experiential learning`
      } else if (childAge <= 12) {
        context += `
- Child is 9-12 years old: Expand emotional vocabulary, use emotion wheels/charts
- Balance respect with age-appropriate guidance
- Introduce more complex emotional concepts gradually`
      } else {
        context += `
- Child is 13+ years old: Use respectful, mature communication
- Focus on independence, identity, and future-oriented thinking
- Avoid overly childish language while maintaining warmth`
      }
    }

    // Add concern-specific guidance
    if (concerns && concerns.length > 0) {
      context += `
- Known concerns: ${concerns.join(', ')}
- Tailor responses to address these specific areas
- Monitor for patterns related to these concerns`
    }

    // Add message-specific guidance
    if (messageContent) {
      const lowerContent = messageContent.toLowerCase()
      if (lowerContent.includes('anxious') || lowerContent.includes('worried') || lowerContent.includes('scared')) {
        context += `
- Child expressing anxiety: Use grounding techniques, validate fears, teach breathing exercises
- Focus on safety and present-moment awareness`
      }
      if (lowerContent.includes('sad') || lowerContent.includes('upset') || lowerContent.includes('cry')) {
        context += `
- Child expressing sadness: Provide emotional validation, explore underlying causes gently
- Normalize sad feelings and offer comfort strategies`
      }
      if (lowerContent.includes('angry') || lowerContent.includes('mad') || lowerContent.includes('frustrat')) {
        context += `
- Child expressing anger: Help identify triggers, teach anger regulation techniques
- Explore feelings underneath the anger (hurt, fear, disappointment)`
      }
    }

    context += `

INTEGRATION DIRECTIVE:
Seamlessly weave this therapeutic knowledge into your responses. Don't reference this guidance directly, but let it inform your therapeutic approach, language choices, and intervention strategies. Be Dr. Emma - warm, professional, and therapeutically informed.`

    return context
  }

  // Check if knowledge base is loaded
  isKnowledgeLoaded(): boolean {
    return this.isLoaded
  }

  // Get specific guidance section
  getGuidanceSection(section: keyof TherapeuticGuidance): string {
    return this.knowledge?.[section] || ''
  }
}

// Export singleton instance
export const embeddedTherapeuticKnowledge = EmbeddedTherapeuticKnowledge.getInstance()

// Auto-load knowledge base when module is imported
embeddedTherapeuticKnowledge.loadKnowledgeBase().catch(error => {
  console.error('Failed to auto-load therapeutic knowledge base:', error)
}) 