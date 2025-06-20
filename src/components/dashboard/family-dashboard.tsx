'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
// Card components now defined inline
import { AlertTriangle, Heart, TrendingUp, Users, MessageCircle, Clock, Home, ArrowLeft } from 'lucide-react'

// Simple card components
const Card = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`rounded-lg border bg-white text-gray-900 shadow-sm ${className}`} onClick={onClick}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} style={{ fontFamily: 'var(--font-poppins)' }}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 ${className}`} style={{ fontFamily: 'var(--font-inter)' }}>
    {children}
  </p>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
)
import { cn, getMoodColor, getAlertColor, formatDateTime } from '@/lib/utils'
import { Child, SocialHealthAnalysis, CrisisAlert } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface FamilyDashboardProps {
  familyId: string
}

interface DashboardData {
  children: Child[]
  recentAnalyses: SocialHealthAnalysis[]
  activeAlerts: CrisisAlert[]
  morningBriefings: Record<string, string>
}

export function FamilyDashboard({ familyId }: FamilyDashboardProps) {
  const [data, setData] = useState<DashboardData>({
    children: [],
    recentAnalyses: [],
    activeAlerts: [],
    morningBriefings: {}
  })
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<string>('')

  useEffect(() => {
    loadDashboardData()
    
    // Set up real-time subscriptions and capture cleanup function
    const cleanup = setupRealTimeSubscriptions()
    
    // Return cleanup function to be called when component unmounts or dependencies change
    return cleanup
  }, [familyId])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Load children for this family
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', familyId)

      if (childrenError) throw childrenError

      // Load recent analyses for all children
      const childIds = children?.map(child => child.id) || []
      const { data: analyses, error: analysesError } = await supabase
        .from('social_health_analyses')
        .select('*')
        .in('child_id', childIds)
        .order('analysis_date', { ascending: false })
        .limit(50)

      if (analysesError) throw analysesError

      // Load active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('crisis_alerts')
        .select('*')
        .in('child_id', childIds)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })

      if (alertsError) throw alertsError

      setData({
        children: children || [],
        recentAnalyses: analyses || [],
        activeAlerts: alerts || [],
        morningBriefings: {}
      })

      if (children?.length && !selectedChild) {
        setSelectedChild(children[0].id)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealTimeSubscriptions() {
    // Create unique channel names to prevent conflicts
    const channelId = `family-${familyId}-${Date.now()}`
    
    const analysesChannel = supabase
      .channel(`${channelId}-analyses`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'social_health_analyses' },
        (payload) => {
          console.log('New analysis received:', payload.new)
          setData(prev => ({
            ...prev,
            recentAnalyses: [payload.new as SocialHealthAnalysis, ...prev.recentAnalyses].slice(0, 50)
          }))
        }
      )
      .subscribe()

    const alertsChannel = supabase
      .channel(`${channelId}-alerts`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crisis_alerts' },
        (payload) => {
          console.log('New alert received:', payload.new)
          setData(prev => ({
            ...prev,
            activeAlerts: [payload.new as CrisisAlert, ...prev.activeAlerts]
          }))
        }
      )
      .subscribe()

    // Return cleanup function
    return () => {
      console.log('Cleaning up subscriptions for family:', familyId)
      analysesChannel.unsubscribe()
      alertsChannel.unsubscribe()
    }
  }

  const selectedChildData = data.children.find(child => child.id === selectedChild)
  const selectedChildAnalyses = data.recentAnalyses
    .filter(analysis => analysis.child_id === selectedChild)
    .slice(0, 7)

  const chartData = selectedChildAnalyses
    .reverse()
    .map(analysis => ({
      date: new Date(analysis.analysis_date).toLocaleDateString(),
      mood: analysis.mood_score,
      social: analysis.social_score
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span style={{ fontFamily: 'var(--font-inter)' }}>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                FamilyConnect
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
              Family Wellness Dashboard
            </h1>
            <p className="text-lg text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
              Building trust through understanding - your family's digital wellness insights
            </p>
          </div>

          {/* Active Alerts */}
          {data.activeAlerts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Areas for Family Conversation ({data.activeAlerts.length})
                </CardTitle>
                <CardDescription>
                  These insights suggest opportunities for supportive family conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.activeAlerts.slice(0, 3).map(alert => {
                    const child = data.children.find(c => c.id === alert.child_id)
                    return (
                      <div
                        key={alert.id}
                        className="p-4 rounded-lg border-l-4 border-blue-400 bg-blue-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-blue-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                              {child?.name}
                            </p>
                            <p className="text-sm text-blue-800" style={{ fontFamily: 'var(--font-inter)' }}>
                              {alert.alert_message}
                            </p>
                          </div>
                          <span className="text-xs text-blue-600" style={{ fontFamily: 'var(--font-inter)' }}>
                            {formatDateTime(alert.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Child Selection */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.children.map(child => {
              const latestAnalysis = data.recentAnalyses.find(a => a.child_id === child.id)
              return (
                <Card
                  key={child.id}
                  className={cn(
                    "min-w-[200px] cursor-pointer transition-all",
                    selectedChild === child.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedChild(child.id)}
                >
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                          {child.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="font-semibold" style={{ fontFamily: 'var(--font-poppins)' }}>{child.name}</h3>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>Age {child.age}</p>
                      {latestAnalysis && (
                        <div className="flex justify-center gap-4 text-xs">
                          <span className="font-medium text-blue-600" style={{ fontFamily: 'var(--font-inter)' }}>
                            Mood: {latestAnalysis.mood_score}/10
                          </span>
                          <span className="font-medium text-green-600" style={{ fontFamily: 'var(--font-inter)' }}>
                            Social: {latestAnalysis.social_score}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedChildData && (
            <>
              {/* Main Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">Current Mood</CardTitle>
                    <Heart className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {selectedChildAnalyses[0]?.mood_score || 'N/A'}/10
                    </div>
                    <p className="text-xs text-blue-700" style={{ fontFamily: 'var(--font-inter)' }}>
                      {selectedChildAnalyses[0]?.emotional_state || 'No recent data'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">Social Wellness</CardTitle>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {selectedChildAnalyses[0]?.social_score || 'N/A'}/10
                    </div>
                    <p className="text-xs text-green-700" style={{ fontFamily: 'var(--font-inter)' }}>
                      Digital friendship patterns
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800">Communication Trend</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {selectedChildAnalyses.length >= 2 
                        ? (selectedChildAnalyses[0]?.mood_score > selectedChildAnalyses[1]?.mood_score ? '↗️' : '↘️')
                        : '➡️'
                      }
                    </div>
                    <p className="text-xs text-purple-700" style={{ fontFamily: 'var(--font-inter)' }}>
                      7-day wellness pattern
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-teal-800">Last Check-in</CardTitle>
                    <Clock className="h-4 w-4 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-teal-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                      {selectedChildAnalyses[0] 
                        ? new Date(selectedChildAnalyses[0].analysis_date).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                    <p className="text-xs text-teal-700" style={{ fontFamily: 'var(--font-inter)' }}>
                      Conversation insights active
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Mood Trend Chart */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>7-Day Wellness Insights</CardTitle>
                    <CardDescription>
                      Understanding emotional and social patterns to guide family conversations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="mood"
                          stackId="1"
                          stroke="#4A90E2"
                          fill="#4A90E2"
                          fillOpacity={0.6}
                          name="Mood Score"
                        />
                        <Area
                          type="monotone"
                          dataKey="social"
                          stackId="2"
                          stroke="#7CB342"
                          fill="#7CB342"
                          fillOpacity={0.6}
                          name="Social Score"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Recent Insights & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Insights</CardTitle>
                    <CardDescription>Understanding patterns to guide supportive conversations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedChildAnalyses[0] ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-green-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Positive Indicators
                          </h4>
                          <ul className="text-sm space-y-1" style={{ fontFamily: 'var(--font-inter)' }}>
                            {selectedChildAnalyses[0].ai_insights?.positive_indicators?.map((indicator: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                {indicator}
                              </li>
                            )) || <li>No positive indicators recorded</li>}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-blue-700 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                            Conversation Opportunities
                          </h4>
                          <ul className="text-sm space-y-1" style={{ fontFamily: 'var(--font-inter)' }}>
                            {selectedChildAnalyses[0].ai_insights?.concerns?.map((concern: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                {concern}
                              </li>
                            )) || <li>No conversation topics suggested</li>}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                        No recent analysis data available
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Family Conversation Starters</CardTitle>
                    <CardDescription>Research-backed approaches for meaningful dialogue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedChildAnalyses[0]?.intervention_recommendations?.length ? (
                      <div className="space-y-3">
                        {selectedChildAnalyses[0].intervention_recommendations.slice(0, 3).map((recommendation: string, index: number) => (
                          <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-l-4 border-blue-400">
                            <p className="text-sm" style={{ fontFamily: 'var(--font-inter)' }}>{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                        No conversation starters available yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 