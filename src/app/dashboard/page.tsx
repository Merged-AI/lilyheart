'use client'

import { useState, useEffect, Suspense } from 'react'
import { Brain, Heart, MessageCircle, TrendingDown, AlertTriangle, Users, Calendar, BarChart3, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { ChildMentalHealthDashboard } from '@/components/dashboard/child-mental-health-dashboard'
import { ChildSelector } from '@/components/dashboard/child-selector'

interface DashboardStats {
  todaysMood: {
    status: string
    trend: string
    color: string
    bgColor: string
  }
  sessionsThisWeek: {
    count: number
    change: string
  }
  emotionalTrend: {
    status: string
    attention: string
    color: string
    bgColor: string
  }
  activeConcerns: {
    count: number
    level: string
  }
  hasAlert: boolean
  alertInfo?: {
    title: string
    description: string
    level: string
  }
}

export default function ParentDashboard() {
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [family, setFamily] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todaysMood: {
      status: 'Loading...',
      trend: '',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    sessionsThisWeek: {
      count: 0,
      change: ''
    },
    emotionalTrend: {
      status: 'Loading...',
      attention: '',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    activeConcerns: {
      count: 0,
      level: ''
    },
    hasAlert: false
  })

  useEffect(() => {
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (isAuthenticated && selectedChildId) {
      fetchDashboardStats()
    }
  }, [isAuthenticated, selectedChildId])

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setFamily(data.family)
        setIsAuthenticated(true)
        
        // Auto-select first child if available
        if (data.children && data.children.length > 0 && !selectedChildId) {
          setSelectedChildId(data.children[0].id)
        }
      } else {
        // Redirect to registration if not authenticated
        window.location.href = '/auth/register'
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      window.location.href = '/auth/register'
    }
  }

  const fetchDashboardStats = async () => {
    if (!selectedChildId) return
    
    try {
      // Fetch recent therapy sessions for selected child
      const sessionsResponse = await fetch(`/api/sessions?limit=50&childId=${selectedChildId}`)
      if (!sessionsResponse.ok) {
        throw new Error('Failed to fetch sessions')
      }
      
      const sessionsData = await sessionsResponse.json()
      const sessions = sessionsData.sessions || []

      if (sessions.length === 0) {
        setDashboardStats({
          todaysMood: {
            status: 'No data yet',
            trend: 'Start first session',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          },
          sessionsThisWeek: {
            count: 0,
            change: 'Ready to begin'
          },
          emotionalTrend: {
            status: 'Baseline',
            attention: 'No sessions yet',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          },
          activeConcerns: {
            count: 0,
            level: 'None identified'
          },
          hasAlert: false
        })
        return
      }

      // Analyze recent data
      const today = new Date()
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)

      // Sessions this week
      const sessionsThisWeek = sessions.filter((session: any) => 
        new Date(session.created_at) >= oneWeekAgo
      )

      // Recent mood analysis (last 3 sessions)
      const recentSessions = sessions.slice(0, 3)
      const moodAnalysis = analyzeMoodTrends(recentSessions)
      
      // Check for concerning patterns
      const concerns = identifyConcerns(sessions)
      const hasAlert = concerns.high > 0 || concerns.medium > 2

      // Generate alert if needed
      let alertInfo = undefined
      if (hasAlert) {
        alertInfo = generateAlert(recentSessions, concerns)
      }

      setDashboardStats({
        todaysMood: moodAnalysis.todaysMood,
        sessionsThisWeek: {
          count: sessionsThisWeek.length,
          change: generateSessionTrend(sessions, oneWeekAgo)
        },
        emotionalTrend: moodAnalysis.emotionalTrend,
        activeConcerns: {
          count: concerns.high + concerns.medium,
          level: concerns.high > 0 ? 'High priority' : concerns.medium > 0 ? 'Monitoring' : 'Stable'
        },
        hasAlert,
        alertInfo
      })

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Keep loading state if there's an error
    }
  }

  const analyzeMoodTrends = (recentSessions: any[]) => {
    if (recentSessions.length === 0) {
      return {
        todaysMood: {
          status: 'No recent data',
          trend: '',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        },
        emotionalTrend: {
          status: 'Unknown',
          attention: '',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
      }
    }

    // Analyze most recent session mood
    const latestSession = recentSessions[0]
    const mood = latestSession.mood_analysis

    if (!mood) {
      return {
        todaysMood: {
          status: 'Processing...',
          trend: 'Analysis in progress',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        emotionalTrend: {
          status: 'Processing',
          attention: 'Analyzing patterns',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
      }
    }

    // Determine current mood status
    const avgAnxiety = mood.anxiety || 0
    const avgSadness = mood.sadness || 0
    const avgStress = mood.stress || 0
    const avgHappiness = mood.happiness || 0

    let currentMoodStatus = 'Stable'
    let moodColor = 'text-green-600'
    let moodBgColor = 'bg-green-100'

    if (avgAnxiety >= 7 || avgSadness >= 7 || avgStress >= 7) {
      currentMoodStatus = 'Needs attention'
      moodColor = 'text-red-600'
      moodBgColor = 'bg-red-100'
    } else if (avgAnxiety >= 5 || avgSadness >= 5 || avgStress >= 5) {
      currentMoodStatus = 'Concerned'
      moodColor = 'text-orange-600'
      moodBgColor = 'bg-orange-100'
    } else if (avgHappiness >= 7) {
      currentMoodStatus = 'Positive'
      moodColor = 'text-green-600'
      moodBgColor = 'bg-green-100'
    }

    // Calculate trend (compare to previous sessions)
    let trend = ''
    if (recentSessions.length >= 2) {
      const previousMood = recentSessions[1].mood_analysis
      if (previousMood) {
        const currentStress = (avgAnxiety + avgSadness + avgStress) / 3
        const previousStress = ((previousMood.anxiety || 0) + (previousMood.sadness || 0) + (previousMood.stress || 0)) / 3
        
        const difference = currentStress - previousStress
        if (Math.abs(difference) > 1) {
          const percentage = Math.round(Math.abs(difference) * 10)
          trend = difference > 0 ? `↑ ${percentage}% from yesterday` : `↓ ${percentage}% from yesterday`
        } else {
          trend = 'Similar to yesterday'
        }
      }
    }

    // Determine emotional trend
    let emotionTrendStatus = 'Stable'
    let emotionTrendAttention = 'Normal range'
    let emotionTrendColor = 'text-green-600'
    let emotionTrendBgColor = 'bg-green-100'

    if (avgAnxiety >= 6 || avgSadness >= 6 || avgStress >= 6) {
      emotionTrendStatus = 'Declining'
      emotionTrendAttention = 'Attention needed'
      emotionTrendColor = 'text-red-600'
      emotionTrendBgColor = 'bg-red-100'
    } else if (avgHappiness >= 7) {
      emotionTrendStatus = 'Improving'
      emotionTrendAttention = 'Positive trend'
      emotionTrendColor = 'text-green-600'
      emotionTrendBgColor = 'bg-green-100'
    }

    return {
      todaysMood: {
        status: currentMoodStatus,
        trend,
        color: moodColor,
        bgColor: moodBgColor
      },
      emotionalTrend: {
        status: emotionTrendStatus,
        attention: emotionTrendAttention,
        color: emotionTrendColor,
        bgColor: emotionTrendBgColor
      }
    }
  }

  const identifyConcerns = (sessions: any[]) => {
    let high = 0
    let medium = 0

    sessions.slice(0, 10).forEach((session: any) => {
      const mood = session.mood_analysis
      if (!mood) return

      // High concern indicators
      if (mood.anxiety >= 8 || mood.sadness >= 8 || mood.stress >= 8) {
        high++
      }
      // Medium concern indicators
      else if (mood.anxiety >= 6 || mood.sadness >= 6 || mood.stress >= 6 || mood.confidence <= 3) {
        medium++
      }
    })

    return { high, medium }
  }

  const generateSessionTrend = (sessions: any[], oneWeekAgo: Date) => {
    const thisWeekSessions = sessions.filter((session: any) => 
      new Date(session.created_at) >= oneWeekAgo
    ).length

    const twoWeeksAgo = new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastWeekSessions = sessions.filter((session: any) => {
      const sessionDate = new Date(session.created_at)
      return sessionDate >= twoWeeksAgo && sessionDate < oneWeekAgo
    }).length

    const difference = thisWeekSessions - lastWeekSessions
    if (difference > 0) {
      return `+${difference} from last week`
    } else if (difference < 0) {
      return `${difference} from last week`
    } else {
      return 'Same as last week'
    }
  }

  const generateAlert = (recentSessions: any[], concerns: any) => {
    if (concerns.high > 0) {
      return {
        title: 'High Priority: Emotional Distress Detected',
        description: `AI has identified elevated anxiety, sadness, or stress levels in recent sessions. Professional consultation recommended.`,
        level: 'high'
      }
    } else if (concerns.medium > 2) {
      return {
        title: 'Pattern Detected: Increased Emotional Concerns',
        description: `Multiple sessions showing emotional challenges. Consider implementing additional support strategies.`,
        level: 'medium'
      }
    }
    return undefined
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Heart Harbor
                </h1>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                  Family Communication Coach
                </p>
              </div>
              
              {family && (
                <div className="hidden md:block ml-6">
                  <p className="text-sm text-gray-600">Welcome back, {family.parent_name}</p>
                  <p className="text-xs text-gray-500">{family.family_name}</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Child Selector */}
              <ChildSelector 
                selectedChildId={selectedChildId}
                onChildSelect={setSelectedChildId}
              />
              
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Emma is online</span>
              </div>
              
              <Link
                href={selectedChildId ? `/chat?childId=${selectedChildId}` : '/chat'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Start Session</span>
              </Link>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                  <Settings className="h-5 w-5" />
                </button>
                <button 
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    window.location.href = '/'
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats - Now Dynamic */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Mood */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latest Mood</p>
                <p className={`text-2xl font-bold mt-1 ${dashboardStats.todaysMood.color}`}>
                  {dashboardStats.todaysMood.status}
                </p>
                <p className="text-sm text-gray-500 mt-1">{dashboardStats.todaysMood.trend}</p>
              </div>
              <div className={`w-12 h-12 ${dashboardStats.todaysMood.bgColor} rounded-lg flex items-center justify-center`}>
                <Heart className={`h-6 w-6 ${dashboardStats.todaysMood.color}`} />
              </div>
            </div>
          </div>

          {/* Session Count */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions This Week</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{dashboardStats.sessionsThisWeek.count}</p>
                <p className="text-sm text-gray-500 mt-1">{dashboardStats.sessionsThisWeek.change}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Emotional Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emotional Trend</p>
                <p className={`text-2xl font-bold mt-1 ${dashboardStats.emotionalTrend.color}`}>
                  {dashboardStats.emotionalTrend.status}
                </p>
                <p className="text-sm text-gray-500 mt-1">{dashboardStats.emotionalTrend.attention}</p>
              </div>
              <div className={`w-12 h-12 ${dashboardStats.emotionalTrend.bgColor} rounded-lg flex items-center justify-center`}>
                <TrendingDown className={`h-6 w-6 ${dashboardStats.emotionalTrend.color}`} />
              </div>
            </div>
          </div>

          {/* Active Concerns */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Concerns</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{dashboardStats.activeConcerns.count}</p>
                <p className="text-sm text-gray-500 mt-1">{dashboardStats.activeConcerns.level}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Alert Banner - Dynamic */}
        {dashboardStats.hasAlert && dashboardStats.alertInfo && (
          <div className={`rounded-xl shadow-sm p-6 border mb-8 flex items-start space-x-4 ${
            dashboardStats.alertInfo.level === 'high' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              dashboardStats.alertInfo.level === 'high' 
                ? 'bg-red-100' 
                : 'bg-orange-100'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                dashboardStats.alertInfo.level === 'high' 
                  ? 'text-red-600' 
                  : 'text-orange-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                dashboardStats.alertInfo.level === 'high' 
                  ? 'text-red-800' 
                  : 'text-orange-800'
              }`} style={{ fontFamily: 'var(--font-poppins)' }}>
                {dashboardStats.alertInfo.title}
              </h3>
              <p className={`mb-4 ${
                dashboardStats.alertInfo.level === 'high' 
                  ? 'text-red-700' 
                  : 'text-orange-700'
              }`} style={{ fontFamily: 'var(--font-inter)' }}>
                {dashboardStats.alertInfo.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dashboardStats.alertInfo.level === 'high'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}>
                  Schedule Family Check-in
                </button>
                <button className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                  dashboardStats.alertInfo.level === 'high'
                    ? 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                    : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50'
                }`}>
                  Find Local Therapists
                </button>
                <button className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                  dashboardStats.alertInfo.level === 'high'
                    ? 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                    : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50'
                }`}>
                  Crisis Resources
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Component */}
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Loading skeletons */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }>
          <ChildMentalHealthDashboard />
        </Suspense>
      </section>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 text-purple-600">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-medium">Analytics</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400">
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Sessions</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400">
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium">Schedule</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400">
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Support</span>
          </button>
        </div>
      </div>
    </div>
  )
} 