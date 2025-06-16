'use client'

import { useState, useEffect } from 'react'
import { Brain, MessageCircle, TrendingUp, TrendingDown, Calendar, Clock, Heart, AlertTriangle, FileText, Phone } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// Mock data for mental health analytics
const moodData = [
  { date: '2024-01-15', happiness: 7, anxiety: 3, sadness: 2, anger: 1, stress: 4 },
  { date: '2024-01-16', happiness: 6, anxiety: 4, sadness: 3, anger: 2, stress: 5 },
  { date: '2024-01-17', happiness: 5, anxiety: 6, sadness: 4, anger: 3, stress: 7 },
  { date: '2024-01-18', happiness: 4, anxiety: 7, sadness: 6, anger: 2, stress: 8 },
  { date: '2024-01-19', happiness: 3, anxiety: 8, sadness: 7, anger: 4, stress: 9 },
  { date: '2024-01-20', happiness: 4, anxiety: 7, sadness: 6, anger: 3, stress: 8 },
  { date: '2024-01-21', happiness: 5, anxiety: 6, sadness: 5, anger: 2, stress: 7 },
]

const therapySessions = [
  {
    id: 1,
    date: '2024-01-21',
    time: '4:30 PM',
    duration: 45,
    mood: 'Anxious',
    topics: ['School stress', 'Friend conflicts', 'Sleep problems'],
    insights: 'Child expressed significant worry about upcoming tests and peer relationships.',
    recommendations: ['Practice relaxation techniques', 'Schedule teacher conference', 'Establish bedtime routine']
  },
  {
    id: 2,
    date: '2024-01-20',
    time: '4:15 PM',
    duration: 38,
    mood: 'Sad',
    topics: ['Bullying', 'Self-esteem', 'Family dynamics'],
    insights: 'Reported bullying incidents at school affecting self-confidence.',
    recommendations: ['Contact school counselor', 'Build confidence activities', 'Family communication session']
  },
  {
    id: 3,
    date: '2024-01-19',
    time: '4:45 PM',
    duration: 52,
    mood: 'Overwhelmed',
    topics: ['Academic pressure', 'Time management', 'Social anxiety'],
    insights: 'Struggling with workload and social situations causing significant stress.',
    recommendations: ['Study schedule planning', 'Social skills practice', 'Stress management techniques']
  }
]

const alertsData = [
  {
    id: 1,
    type: 'high',
    title: 'Elevated Anxiety Levels',
    description: 'Consistent anxiety scores above 7/10 for 3 consecutive days',
    timestamp: '2 hours ago',
    action: 'Consider scheduling in-person therapy session'
  },
  {
    id: 2,
    type: 'medium',
    title: 'Social Withdrawal Pattern',
    description: 'Decreased discussion of peer interactions and social activities',
    timestamp: '1 day ago',
    action: 'Encourage social activities and check with teachers'
  }
]

const emotionDistribution = [
  { name: 'Anxiety', value: 35, color: '#ef4444' },
  { name: 'Sadness', value: 25, color: '#3b82f6' },
  { name: 'Happiness', value: 20, color: '#10b981' },
  { name: 'Stress', value: 15, color: '#f59e0b' },
  { name: 'Anger', value: 5, color: '#8b5cf6' },
]

// Enhanced communication pattern tracking for family insights
const communicationPatterns = [
  {
    id: 'emotional_expression',
    name: 'Emotional Expression & Communication',
    confidence: 78,
    observations: [
      'Child expressing feelings more openly in recent conversations',
      'Increased comfort discussing school experiences',
      'Growing emotional vocabulary over 8 conversations',
      'Better at describing specific worries and concerns'
    ],
    parentInsights: [
      'How can I continue encouraging this open communication?',
      'What conversation starters work best for my child?',
      'When is the best time for meaningful check-ins?'
    ],
    communicationTips: 'Children often need consistent, judgment-free spaces to practice emotional expression. Regular check-ins help build trust.',
    nextSteps: 'Continue daily emotional check-ins and celebrate communication growth'
  },
  {
    id: 'stress_communication',
    name: 'Stress & Worry Discussion Patterns',
    confidence: 85,
    observations: [
      'School-related stress mentioned in 15 conversations',
      'Physical stress responses described (stomach aches, tiredness)',
      'Worry patterns around social situations',
      'Sleep concerns affecting daily communication'
    ],
    parentInsights: [
      'How can our family better support during stressful times?',
      'What stress management techniques might help?',
      'Should we discuss these patterns with school counselors?'
    ],
    communicationTips: 'Children often express stress through physical complaints rather than direct emotional language.',
    nextSteps: 'Family stress management planning and possible school communication'
  },
  {
    id: 'social_communication',
    name: 'Social Relationships & Friendship Topics',
    confidence: 62,
    observations: [
      'Frequent mentions of feeling misunderstood by peers',
      'Excitement about specific friendships',
      'Challenges with group social situations',
      'Growing confidence in one-on-one friendships'
    ],
    parentInsights: [
      'How can we support healthy friendship development?',
      'Are there social skills we could practice as a family?',
      'Should we coordinate with other parents for social opportunities?'
    ],
    communicationTips: 'Social development varies widely. Focus on quality friendships over quantity.',
    nextSteps: 'Family social skills practice and friendship celebration'
  }
]

const familyInsights = [
  {
    category: 'Communication Strengths',
    trend: 'Growing Confidence',
    details: 'Child initiating conversations more frequently. Average conversation length increasing from 10 to 25 minutes.',
    familyBenefit: 'Stronger parent-child connection through regular emotional check-ins',
    suggestedActions: 'Continue consistent conversation opportunities without pressure'
  },
  {
    category: 'Emotional Wellness',
    trend: 'Developing Awareness',
    details: 'Child showing increased ability to name emotions and describe experiences with detail.',
    familyBenefit: 'Better family understanding of child\'s emotional world and needs',
    suggestedActions: 'Celebrate emotional vocabulary growth and provide validation'
  },
  {
    category: 'Family Dynamics',
    trend: 'Building Trust',
    details: 'More comfortable sharing family relationship topics and asking for support when needed.',
    familyBenefit: 'Improved family communication and conflict resolution skills',
    suggestedActions: 'Family meetings to practice communication skills together'
  }
]

const familyStrengths = {
  communicationStrengths: [
    'Child feels safe expressing difficult emotions',
    'Creative problem-solving in family conversations',
    'Developing empathy through family discussions',
    'Growing confidence in asking for help when needed'
  ],
  areasForGrowth: [
    'Building stress management skills as a family',
    'Practicing conflict resolution techniques',
    'Developing routine check-in practices',
    'Supporting social skill development'
  ],
  familyDevelopment: [
    'Communication skills developing appropriately for age',
    'Emotional expression becoming more sophisticated',
    'Family relationship patterns showing positive growth',
    'Trust and openness increasing over time'
  ]
}

export function ChildMentalHealthDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [showDetailedPattern, setShowDetailedPattern] = useState<string | null>(null)
  const [realTimeData, setRealTimeData] = useState({
    sessions: therapySessions,
    moodData: moodData,
    alerts: alertsData
  })
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch real data on component mount
  useEffect(() => {
    fetchRealTimeData()
    fetchEnhancedAnalysis()
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchRealTimeData()
      fetchEnhancedAnalysis()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const fetchRealTimeData = async () => {
    try {
      // Fetch recent therapy sessions
      const sessionsResponse = await fetch('/api/sessions?limit=10')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        
        // Transform database sessions to component format
        const transformedSessions = sessionsData.sessions.map((session: any, index: number) => ({
          id: session.id || index + 1,
          date: new Date(session.created_at).toLocaleDateString(),
          time: new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: session.session_duration || 0,
          mood: determineMoodFromAnalysis(session.mood_analysis),
          topics: extractTopicsFromMessage(session.user_message),
          insights: session.ai_response?.substring(0, 200) + '...' || 'AI provided supportive guidance.',
          recommendations: generateRecommendationsFromMood(session.mood_analysis)
        }))

        setRealTimeData(prev => ({
          ...prev,
          sessions: transformedSessions
        }))
      }

      // Update mood data based on recent sessions
      const moodResponse = await fetch('/api/mood-tracking?days=7')
      if (moodResponse.ok) {
        const moodDataResponse = await moodResponse.json()
        setRealTimeData(prev => ({
          ...prev,
          moodData: moodDataResponse.moodData || moodData
        }))
      }

    } catch (error) {
      console.error('Error fetching real-time data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEnhancedAnalysis = async () => {
    try {
      const response = await fetch('/api/enhanced-analysis')
      if (response.ok) {
        const analysisData = await response.json()
        // The API returns the analysis nested under .analysis property
        setEnhancedAnalysis(analysisData.analysis || null)
      }
    } catch (error) {
      console.error('Error fetching enhanced analysis:', error)
    }
  }

  const determineMoodFromAnalysis = (moodAnalysis: any) => {
    if (!moodAnalysis) return 'Neutral'
    
    const { anxiety = 0, sadness = 0, happiness = 0, stress = 0 } = moodAnalysis
    
    if (anxiety >= 6) return 'Anxious'
    if (sadness >= 6) return 'Sad'
    if (stress >= 6) return 'Stressed'
    if (happiness >= 6) return 'Happy'
    return 'Mixed'
  }

  const extractTopicsFromMessage = (message: string) => {
    if (!message) return ['General conversation']
    
    const topics = []
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('school') || lowerMessage.includes('teacher') || lowerMessage.includes('homework')) {
      topics.push('School stress')
    }
    if (lowerMessage.includes('friend') || lowerMessage.includes('social') || lowerMessage.includes('peer')) {
      topics.push('Social relationships')
    }
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('nervous')) {
      topics.push('Anxiety')
    }
    if (lowerMessage.includes('family') || lowerMessage.includes('parent') || lowerMessage.includes('sibling')) {
      topics.push('Family dynamics')
    }
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      topics.push('Sleep issues')
    }
    
    return topics.length > 0 ? topics : ['General conversation']
  }

  const generateRecommendationsFromMood = (moodAnalysis: any) => {
    if (!moodAnalysis) return ['Continue regular check-ins']
    
    const recommendations = []
    const { anxiety = 0, sadness = 0, stress = 0, confidence = 5 } = moodAnalysis
    
    if (anxiety >= 6) {
      recommendations.push('Practice breathing exercises together')
      recommendations.push('Consider anxiety management techniques')
    }
    if (sadness >= 6) {
      recommendations.push('Schedule quality time together')
      recommendations.push('Encourage expression of feelings')
    }
    if (stress >= 6) {
      recommendations.push('Review daily schedule and reduce pressure')
      recommendations.push('Introduce stress-relief activities')
    }
    if (confidence <= 3) {
      recommendations.push('Focus on building self-esteem')
      recommendations.push('Celebrate small achievements')
    }
    
    return recommendations.length > 0 ? recommendations : ['Continue supportive conversations']
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Analysis Area */}
      <div className="lg:col-span-2 space-y-8">
        {/* Communication Pattern Insights */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
              Family Communication Insights & Patterns
            </h2>
            <div className="text-sm text-gray-500">
              Based on {enhancedAnalysis?.totalSessions || realTimeData.sessions.length} therapy sessions
            </div>
          </div>
          
          <div className="space-y-6">
            {enhancedAnalysis && enhancedAnalysis.communicationPatterns && enhancedAnalysis.communicationPatterns.length > 0 ? (
              enhancedAnalysis.communicationPatterns.map((pattern: any) => (
                <div key={pattern.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{pattern.title}</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-32">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${pattern.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{pattern.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailedPattern(showDetailedPattern === pattern.id ? null : pattern.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {showDetailedPattern === pattern.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {showDetailedPattern === pattern.id && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Observations:</h4>
                      <ul className="space-y-1">
                        {pattern.observations?.map((observation: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{observation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Parent Insights:</h4>
                      <ul className="space-y-1">
                        {pattern.parentInsights?.map((insight: string, index: number) => (
                          <li key={index} className="text-sm text-purple-700 flex items-start space-x-2">
                            <span className="text-purple-500 mt-1">?</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Communication Tips:</h4>
                      <div className="text-sm text-blue-800">
                        {Array.isArray(pattern.communicationTips) ? (
                          <ul className="space-y-1">
                            {pattern.communicationTips.map((tip: string, index: number) => (
                              <li key={index}>• {tip}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{pattern.communicationTips}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-1">Recommended Next Step:</h4>
                      <p className="text-sm text-green-800">{pattern.recommendedNextStep || pattern.nextSteps}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <Brain size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">No Analysis Available Yet</p>
                  <p className="text-sm">Complete more therapy sessions to see communication patterns and insights.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Family Communication Growth */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
            Family Communication Growth & Development
          </h2>
          
          <div className="space-y-6">
            {enhancedAnalysis && enhancedAnalysis.familyBenefits && enhancedAnalysis.familyBenefits.length > 0 ? (
              enhancedAnalysis.familyBenefits.map((benefit: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-400 pl-6 py-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{benefit.area}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    benefit.currentProgress === 'Growing Confidence' ? 'bg-green-100 text-green-700' :
                    benefit.currentProgress === 'Developing Awareness' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {benefit.currentProgress}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{benefit.benefit}</p>
                
                <div className="space-y-2">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-1">Suggested Actions:</p>
                    <div className="text-sm text-green-800">
                      {Array.isArray(benefit.suggestedActions) ? (
                        <ul className="space-y-1">
                          {benefit.suggestedActions.map((action: string, actionIndex: number) => (
                            <li key={actionIndex}>• {action}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{benefit.suggestedActions}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">Family Growth Analysis Coming Soon</p>
                  <p className="text-sm">More sessions needed to generate family communication insights.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversation History */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
            Recent Conversations & Emotional Check-ins
          </h2>
          
          <div className="space-y-4">
            {realTimeData.sessions.slice(0, 5).map((session, index) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">{session.date} at {session.time}</div>
                    <div className="text-sm text-gray-600">{session.duration} min</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.mood === 'Anxious' ? 'bg-red-100 text-red-700' :
                    session.mood === 'Sad' ? 'bg-blue-100 text-blue-700' :
                    session.mood === 'Happy' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {session.mood}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Themes:</p>
                    <div className="flex flex-wrap gap-1">
                      {session.topics.map((topic, topicIndex) => (
                        <span key={topicIndex} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Clinical Notes:</p>
                    <p className="text-xs text-gray-600">{session.insights}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        {/* Family Communication Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Family Communication Summary
          </h3>
          
          <div className="space-y-4">
            {enhancedAnalysis && enhancedAnalysis.overallInsights ? (
              <>
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Communication Strengths:</h4>
                  <ul className="space-y-1">
                    {enhancedAnalysis.overallInsights.strengths?.map((strength: string, index: number) => (
                      <li key={index} className="text-sm text-green-700 flex items-start space-x-2">
                        <span className="text-green-500 mt-1">+</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-orange-800 mb-2">Areas for Family Growth:</h4>
                  <ul className="space-y-1">
                    {enhancedAnalysis.overallInsights.growthAreas?.map((area: string, index: number) => (
                      <li key={index} className="text-sm text-orange-700 flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {enhancedAnalysis.overallInsights.recommendations?.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Analysis data will appear here after more therapy sessions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Conversation Prep */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Professional Conversation Organization
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">Key Conversation Topics:</h4>
              <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                <li>Communication patterns and family dynamics</li>
                <li>Emotional wellness and stress management</li>
                <li>Social relationships and friendship development</li>
                <li>School experiences and learning environment</li>
              </ol>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">Questions to Consider:</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• How can we better support our child's emotional needs?</li>
                <li>• What communication strategies work best for our family?</li>
                <li>• Are there resources to help with stress management?</li>
                <li>• How can we strengthen family relationships?</li>
              </ul>
            </div>
            
            <button className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
              Organize Family Conversation Notes
            </button>
          </div>
        </div>

        {/* Family Wellness Resources */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Family Communication & Wellness Tips
          </h3>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 text-sm">Building Trust in Conversations</h4>
              <p className="text-xs text-blue-700 mt-1">Regular check-ins without pressure create safe spaces for children to share their feelings naturally.</p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 text-sm">Understanding Emotional Expression</h4>
              <p className="text-xs text-green-700 mt-1">Children often express stress through physical complaints or behavior changes rather than words.</p>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg">
              <h4 className="font-medium text-orange-800 text-sm">Family Communication Growth</h4>
              <p className="text-xs text-orange-700 mt-1">Every family develops at their own pace. Focus on progress, not perfection, in communication skills.</p>
            </div>
          </div>
        </div>

        {/* Family Action Items */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Family Communication Goals
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-green-800 text-sm">This Week</p>
                <p className="text-green-700 text-xs">Practice daily emotional check-ins with your child</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-blue-800 text-sm">Ongoing</p>
                <p className="text-blue-700 text-xs">Create consistent family conversation time without distractions</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-purple-800 text-sm">If Needed</p>
                <p className="text-purple-700 text-xs">Consider family communication support resources if challenges persist</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}