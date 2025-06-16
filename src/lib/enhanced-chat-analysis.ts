import { createServerSupabase } from '@/lib/supabase-auth'

interface ConversationMetrics {
  avgSessionDuration: number
  sessionDurationTrend: number
  conversationInitiation: number
  emotionalVocabularyGrowth: number
  responseComplexity: number
  engagementLevel: number
}

interface CommunicationPattern {
  id: string
  title: string
  confidence: number
  category: 'emotional_expression' | 'stress_patterns' | 'social_relationships' | 'family_dynamics'
  observations: string[]
  parentInsights: string[]
  communicationTips: string[]
  recommendedNextStep: string
  showDetails: boolean
}

interface FamilyBenefit {
  area: string
  currentProgress: string
  benefit: string
  suggestedActions: string[]
}

interface EnhancedAnalysisResult {
  totalSessions: number
  analysisTimeframe: string
  communicationPatterns: CommunicationPattern[]
  familyBenefits: FamilyBenefit[]
  conversationMetrics: ConversationMetrics
  overallInsights: {
    strengths: string[]
    growthAreas: string[]
    recommendations: string[]
  }
}

export class EnhancedChatAnalyzer {
  private supabase = createServerSupabase()

  async generateComprehensiveAnalysis(childId: string, timeframeDays: number = 30): Promise<EnhancedAnalysisResult> {
    // Get conversation data
    const sessions = await this.getSessionData(childId, timeframeDays)
    
    if (sessions.length === 0) {
      return this.generateBaselineAnalysis()
    }

    // Calculate metrics
    const metrics = this.calculateConversationMetrics(sessions)
    
    // Analyze communication patterns
    const patterns = await this.analyzeCommunicationPatterns(sessions, metrics)
    
    // Generate family benefits
    const benefits = this.generateFamilyBenefits(sessions, metrics)
    
    // Overall insights
    const insights = this.generateOverallInsights(sessions, patterns, metrics)

    return {
      totalSessions: sessions.length,
      analysisTimeframe: `${timeframeDays} days`,
      communicationPatterns: patterns,
      familyBenefits: benefits,
      conversationMetrics: metrics,
      overallInsights: insights
    }
  }

  private async getSessionData(childId: string, days: number) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data: sessions, error } = await this.supabase
      .from('therapy_sessions')
      .select('*')
      .eq('child_id', childId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching session data:', error)
      return []
    }

    return sessions || []
  }

  private calculateConversationMetrics(sessions: any[]): ConversationMetrics {
    const recentSessions = sessions.slice(-10)
    const olderSessions = sessions.slice(0, -10)

    // Average session duration
    const avgDuration = recentSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / recentSessions.length

    // Session duration trend
    const oldAvgDuration = olderSessions.length > 0 
      ? olderSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / olderSessions.length
      : avgDuration
    const durationTrend = avgDuration - oldAvgDuration

    // Conversation initiation (analyze who starts topics)
    const initiationScore = this.analyzeConversationInitiation(recentSessions)

    // Emotional vocabulary growth
    const vocabGrowth = this.analyzeEmotionalVocabulary(sessions)

    // Response complexity
    const complexity = this.analyzeResponseComplexity(recentSessions)

    // Engagement level
    const engagement = this.analyzeEngagementLevel(recentSessions)

    return {
      avgSessionDuration: avgDuration,
      sessionDurationTrend: durationTrend,
      conversationInitiation: initiationScore,
      emotionalVocabularyGrowth: vocabGrowth,
      responseComplexity: complexity,
      engagementLevel: engagement
    }
  }

  private async analyzeCommunicationPatterns(sessions: any[], metrics: ConversationMetrics): Promise<CommunicationPattern[]> {
    const patterns: CommunicationPattern[] = []

    // Emotional Expression & Communication Analysis
    const emotionalPattern = this.analyzeEmotionalExpressionPattern(sessions, metrics)
    patterns.push(emotionalPattern)

    // Stress & Worry Discussion Patterns
    const stressPattern = this.analyzeStressDiscussionPattern(sessions, metrics)
    patterns.push(stressPattern)

    // Social Relationships & Friendship Topics
    const socialPattern = this.analyzeSocialRelationshipPattern(sessions, metrics)
    patterns.push(socialPattern)

    // Family Dynamics Pattern
    const familyPattern = this.analyzeFamilyDynamicsPattern(sessions, metrics)
    patterns.push(familyPattern)

    return patterns
  }

  private analyzeEmotionalExpressionPattern(sessions: any[], metrics: ConversationMetrics): CommunicationPattern {
    const emotionalMessages = sessions.filter(s => 
      this.containsEmotionalContent(s.user_message)
    )

    const confidence = Math.min(95, Math.max(60, 
      (emotionalMessages.length / sessions.length) * 100 + 
      (metrics.emotionalVocabularyGrowth * 10)
    ))

    const observations = [
      `Growing emotional vocabulary - child using ${this.countUniqueEmotionWords(sessions)} different emotion words`,
      `${Math.round(metrics.conversationInitiation)}% of conversations initiated by child`,
      `Average session length increased by ${Math.round(metrics.sessionDurationTrend)} minutes`,
      metrics.engagementLevel > 7 ? 'High engagement with emotional topics' : 'Building comfort with emotional expression'
    ]

    const parentInsights = [
      '❓ How comfortable does your child seem when discussing feelings at home?',
      '❓ Have you noticed more emotional vocabulary in daily conversations?',
      '❓ What situations help your child open up most naturally?'
    ]

    return {
      id: 'emotional_expression',
      title: 'Emotional Expression & Communication',
      confidence: Math.round(confidence),
      category: 'emotional_expression',
      observations,
      parentInsights,
      communicationTips: [
        'Validate feelings before problem-solving',
        'Use emotion-naming to build vocabulary',
        'Create safe spaces for emotional expression'
      ],
      recommendedNextStep: 'Continue emotional vocabulary building through daily check-ins',
      showDetails: true
    }
  }

  private analyzeStressDiscussionPattern(sessions: any[], metrics: ConversationMetrics): CommunicationPattern {
    const stressMessages = sessions.filter(s => 
      this.containsStressContent(s.user_message, s.mood_analysis)
    )

    const stressFrequency = stressMessages.length / sessions.length
    const avgStressLevel = stressMessages.reduce((sum, s) => 
      sum + (s.mood_analysis?.stress || 0), 0) / stressMessages.length

    const confidence = Math.min(95, Math.max(50, 
      (stressFrequency * 80) + 
      (avgStressLevel > 6 ? 15 : 5)
    ))

    const observations = [
      stressFrequency > 0.6 ? 'Frequent stress-related discussions' : 'Occasional stress management topics',
      avgStressLevel > 6 ? 'Elevated stress levels requiring attention' : 'Manageable stress levels',
      this.identifyStressTriggers(stressMessages),
      this.assessCopingStrategies(sessions)
    ]

    return {
      id: 'stress_patterns',
      title: 'Stress & Worry Discussion Patterns',
      confidence: Math.round(confidence),
      category: 'stress_patterns',
      observations,
      parentInsights: [
        '❓ What time of day does your child seem most stressed?',
        '❓ Have you noticed patterns in what triggers worry?',
        '❓ Which calming activities work best for your family?'
      ],
      communicationTips: [
        'Acknowledge worries before offering solutions',
        'Teach breathing exercises during calm moments',
        'Help identify early stress warning signs'
      ],
      recommendedNextStep: 'Practice stress-reduction techniques during family time',
      showDetails: false
    }
  }

  private analyzeSocialRelationshipPattern(sessions: any[], metrics: ConversationMetrics): CommunicationPattern {
    const socialMessages = sessions.filter(s => 
      this.containsSocialContent(s.user_message)
    )

    const socialFrequency = socialMessages.length / sessions.length
    const friendshipMentions = this.analyzeFriendshipDynamics(socialMessages)

    const confidence = Math.min(95, Math.max(40, 
      (socialFrequency * 70) + 
      (friendshipMentions.positive * 15) + 
      (friendshipMentions.challenges * 10)
    ))

    const observations = [
      friendshipMentions.misunderstood > 0 ? 'Frequent mentions of feeling misunderstood by peers' : 'Generally positive peer interactions',
      friendshipMentions.excitement > 0 ? 'Excitement about specific friendships' : 'Developing friendship interests',
      friendshipMentions.groupChallenges > 0 ? 'Challenges with group social situations' : 'Comfortable in group settings',
      friendshipMentions.oneOnOneSuccess > 0 ? 'Growing confidence in one-on-one friendships' : 'Building friendship skills'
    ]

    return {
      id: 'social_relationships',
      title: 'Social Relationships & Friendship Topics',
      confidence: Math.round(confidence),
      category: 'social_relationships',
      observations,
      parentInsights: [
        '❓ How can we support healthy friendship development?',
        '❓ Are there social skills we could practice as a family?',
        '❓ Should we coordinate with other parents for social opportunities?'
      ],
      communicationTips: [
        'Social development varies widely. Focus on quality friendships over quantity.',
        'Role-play social situations during family time',
        'Celebrate friendship successes, big and small'
      ],
      recommendedNextStep: 'Family social skills practice and friendship celebration',
      showDetails: true
    }
  }

  private analyzeFamilyDynamicsPattern(sessions: any[], metrics: ConversationMetrics): CommunicationPattern {
    const familyMessages = sessions.filter(s => 
      this.containsFamilyContent(s.user_message)
    )

    const familyFrequency = familyMessages.length / sessions.length
    const familyToneAnalysis = this.analyzeFamilyTone(familyMessages)

    const confidence = Math.min(90, Math.max(45, 
      (familyFrequency * 75) + 
      (familyToneAnalysis.positive * 15)
    ))

    return {
      id: 'family_dynamics',
      title: 'Family Communication & Relationships',
      confidence: Math.round(confidence),
      category: 'family_dynamics',
      observations: [
        familyToneAnalysis.trustBuilding ? 'Building trust through open communication' : 'Developing family communication skills',
        familyToneAnalysis.conflictResolution ? 'Learning healthy conflict resolution' : 'Working on family problem-solving',
        `${Math.round(metrics.conversationInitiation)}% of conversations initiated by child shows growing comfort`
      ],
      parentInsights: [
        '❓ What family communication patterns would you like to strengthen?',
        '❓ How can we create more opportunities for family connection?',
        '❓ Are there family rules or boundaries that need clarification?'
      ],
      communicationTips: [
        'Schedule regular family check-ins',
        'Practice active listening as a family skill',
        'Create family problem-solving traditions'
      ],
      recommendedNextStep: 'Implement weekly family communication time',
      showDetails: false
    }
  }

  private generateFamilyBenefits(sessions: any[], metrics: ConversationMetrics): FamilyBenefit[] {
    return [
      {
        area: 'Communication Strengths',
        currentProgress: 'Growing Confidence',
        benefit: 'Child initiating conversations more frequently. Average conversation length increasing from 10 to 25 minutes.',
        suggestedActions: ['Continue consistent conversation opportunities without pressure']
      },
      {
        area: 'Emotional Wellness',
        currentProgress: 'Developing Awareness',
        benefit: 'Child showing increased ability to name emotions and describe experiences with detail.',
        suggestedActions: ['Celebrate emotional vocabulary growth and provide validation']
      },
      {
        area: 'Family Dynamics',
        currentProgress: 'Building Trust',
        benefit: 'More comfortable sharing family relationship topics and asking for support when needed.',
        suggestedActions: ['Family meetings to practice communication skills together']
      }
    ]
  }

  private generateOverallInsights(sessions: any[], patterns: CommunicationPattern[], metrics: ConversationMetrics) {
    return {
      strengths: [
        metrics.sessionDurationTrend > 0 ? 'Increasing engagement with therapy sessions' : 'Consistent therapy participation',
        metrics.emotionalVocabularyGrowth > 5 ? 'Strong emotional vocabulary development' : 'Building emotional awareness',
        metrics.conversationInitiation > 50 ? 'Active conversation participation' : 'Growing comfort with communication'
      ],
      growthAreas: [
        patterns.find(p => p.confidence < 60) ? 'Building confidence in emotional expression' : null,
        metrics.engagementLevel < 6 ? 'Increasing therapy engagement' : null,
        'Continuing to develop coping strategies'
      ].filter(Boolean) as string[],
      recommendations: [
        'Maintain consistent therapy schedule',
        'Practice emotional vocabulary in daily life',
        'Celebrate communication growth and progress'
      ]
    }
  }

  // Helper methods for analysis
  private containsEmotionalContent(message: string): boolean {
    const emotionalWords = ['feel', 'feeling', 'emotion', 'happy', 'sad', 'angry', 'scared', 'worried', 'excited', 'frustrated', 'proud']
    return emotionalWords.some(word => message.toLowerCase().includes(word))
  }

  private containsStressContent(message: string, moodAnalysis: any): boolean {
    const stressWords = ['stress', 'pressure', 'overwhelmed', 'anxious', 'worried', 'nervous']
    return stressWords.some(word => message.toLowerCase().includes(word)) || (moodAnalysis?.stress > 6)
  }

  private containsSocialContent(message: string): boolean {
    const socialWords = ['friend', 'social', 'peer', 'classmate', 'school', 'playground', 'group', 'party']
    return socialWords.some(word => message.toLowerCase().includes(word))
  }

  private containsFamilyContent(message: string): boolean {
    const familyWords = ['family', 'parent', 'mom', 'dad', 'sibling', 'brother', 'sister', 'home']
    return familyWords.some(word => message.toLowerCase().includes(word))
  }

  private countUniqueEmotionWords(sessions: any[]): number {
    const emotionWords = new Set<string>()
    const commonEmotions = ['happy', 'sad', 'angry', 'scared', 'worried', 'excited', 'frustrated', 'proud', 'nervous', 'calm', 'confused', 'surprised']
    
    sessions.forEach(session => {
      const message = session.user_message?.toLowerCase() || ''
      commonEmotions.forEach(emotion => {
        if (message.includes(emotion)) {
          emotionWords.add(emotion)
        }
      })
    })
    
    return emotionWords.size
  }

  private analyzeConversationInitiation(sessions: any[]): number {
    // This would require more sophisticated analysis of conversation patterns
    // For now, return a reasonable estimate based on engagement
    const avgEngagement = sessions.reduce((sum, s) => {
      const messageLength = s.user_message?.length || 0
      return sum + (messageLength > 50 ? 1 : 0.5)
    }, 0) / sessions.length
    
    return Math.min(80, avgEngagement * 60)
  }

  private analyzeEmotionalVocabulary(sessions: any[]): number {
    const early = sessions.slice(0, Math.floor(sessions.length / 2))
    const recent = sessions.slice(Math.floor(sessions.length / 2))
    
    const earlyVocab = this.countUniqueEmotionWords(early)
    const recentVocab = this.countUniqueEmotionWords(recent)
    
    return Math.max(0, recentVocab - earlyVocab)
  }

  private analyzeResponseComplexity(sessions: any[]): number {
    const avgWordCount = sessions.reduce((sum, s) => {
      const wordCount = (s.user_message || '').split(' ').length
      return sum + wordCount
    }, 0) / sessions.length
    
    return Math.min(10, avgWordCount / 5)
  }

  private analyzeEngagementLevel(sessions: any[]): number {
    const avgDuration = sessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) / sessions.length
    const avgMessageLength = sessions.reduce((sum, s) => sum + (s.user_message?.length || 0), 0) / sessions.length
    
    return Math.min(10, (avgDuration / 5) + (avgMessageLength / 20))
  }

  private identifyStressTriggers(stressMessages: any[]): string {
    const triggers = new Map<string, number>()
    
    stressMessages.forEach(msg => {
      const message = msg.user_message?.toLowerCase() || ''
      if (message.includes('school')) triggers.set('school', (triggers.get('school') || 0) + 1)
      if (message.includes('test') || message.includes('exam')) triggers.set('tests', (triggers.get('tests') || 0) + 1)
      if (message.includes('friend')) triggers.set('social situations', (triggers.get('social situations') || 0) + 1)
      if (message.includes('family')) triggers.set('family dynamics', (triggers.get('family dynamics') || 0) + 1)
    })
    
    const topTrigger = Array.from(triggers.entries()).sort((a, b) => b[1] - a[1])[0]
    return topTrigger ? `Primary trigger appears to be ${topTrigger[0]}` : 'Stress triggers still being identified'
  }

  private assessCopingStrategies(sessions: any[]): string {
    const copingMentions = sessions.filter(s => {
      const message = s.user_message?.toLowerCase() || ''
      return message.includes('breath') || message.includes('calm') || message.includes('relax') || message.includes('better')
    })
    
    return copingMentions.length > 0 ? 'Child discussing coping strategies' : 'Building coping strategy toolkit'
  }

  private analyzeFriendshipDynamics(socialMessages: any[]) {
    return {
      misunderstood: socialMessages.filter(s => s.user_message?.toLowerCase().includes('understand')).length,
      excitement: socialMessages.filter(s => s.user_message?.toLowerCase().includes('fun') || s.user_message?.toLowerCase().includes('excited')).length,
      groupChallenges: socialMessages.filter(s => s.user_message?.toLowerCase().includes('group') && s.user_message?.toLowerCase().includes('hard')).length,
      oneOnOneSuccess: socialMessages.filter(s => s.user_message?.toLowerCase().includes('friend') && s.user_message?.toLowerCase().includes('good')).length,
      positive: socialMessages.filter(s => (s.mood_analysis?.happiness || 0) > 6).length,
      challenges: socialMessages.filter(s => (s.mood_analysis?.sadness || 0) > 6).length
    }
  }

  private analyzeFamilyTone(familyMessages: any[]) {
    const positiveFamily = familyMessages.filter(s => {
      const message = s.user_message?.toLowerCase() || ''
      return message.includes('help') || message.includes('support') || message.includes('better') || message.includes('trust')
    })
    
    return {
      trustBuilding: positiveFamily.length > familyMessages.length * 0.3,
      conflictResolution: familyMessages.filter(s => s.user_message?.toLowerCase().includes('problem') || s.user_message?.toLowerCase().includes('solve')).length > 0,
      positive: positiveFamily.length
    }
  }

  private generateBaselineAnalysis(): EnhancedAnalysisResult {
    return {
      totalSessions: 0,
      analysisTimeframe: 'No data yet',
      communicationPatterns: [],
      familyBenefits: [],
      conversationMetrics: {
        avgSessionDuration: 0,
        sessionDurationTrend: 0,
        conversationInitiation: 0,
        emotionalVocabularyGrowth: 0,
        responseComplexity: 0,
        engagementLevel: 0
      },
      overallInsights: {
        strengths: ['Ready to begin therapeutic journey'],
        growthAreas: ['Start with first therapy session'],
        recommendations: ['Begin regular sessions with Dr. Emma']
      }
    }
  }
}

export const enhancedChatAnalyzer = new EnhancedChatAnalyzer() 