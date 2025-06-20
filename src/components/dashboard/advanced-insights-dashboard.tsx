'use client'

import { useState, useEffect } from 'react'
import { Brain, AlertTriangle, Target, TrendingUp, TrendingDown, CheckCircle, Clock, User, Heart, Shield, FileText, ArrowRight, Zap, Star } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

// Advanced analysis data interfaces
interface AnalysisData {
  type: string
  child: {
    id: string
    name: string
    age: number
  }
  analysis: {
    overallRiskLevel: 'low' | 'moderate' | 'high' | 'crisis'
    primaryConcerns: string[]
    behavioralPatterns: BehavioralPattern[]
    potentialConditions: PotentialCondition[]
    symptomSeverity: SymptomSeverity
    immediateActions: Action[]
    weeklyGoals: Goal[]
    longTermStrategy: Strategy
    therapyRecommendations: TherapyRecommendation[]
    interventionPlan: InterventionPlan
    progressTracking: ProgressMetric[]
  }
  parentInsights: {
    riskAssessment: {
      level: string
      description: string
      urgency: string
    }
    keyFindings: string[]
    immediateActions: Action[]
    weeklyFocus: Goal[]
    professionalRecommendation: any
    progressMetrics: ProgressMetric[]
    nextSteps: string[]
  }
  conversationCount: number
  analysisTimestamp: string
}

interface BehavioralPattern {
  type: 'escalating' | 'cyclical' | 'trigger-based' | 'situational'
  description: string
  frequency: string
  triggers: string[]
  impact: 'mild' | 'moderate' | 'severe'
  trend: 'improving' | 'stable' | 'worsening'
}

interface PotentialCondition {
  condition: string
  confidence: number
  symptoms: string[]
  dsm5Criteria: string[]
  recommendedAssessment: string
}

interface SymptomSeverity {
  anxiety: { level: number; symptoms: string[] }
  depression: { level: number; symptoms: string[] }
  adhd: { level: number; symptoms: string[] }
  anger: { level: number; symptoms: string[] }
  trauma: { level: number; symptoms: string[] }
}

interface Action {
  priority: 'immediate' | 'urgent' | 'important'
  category: 'communication' | 'behavioral' | 'environmental' | 'professional'
  title: string
  description: string
  steps: string[]
  timeframe: string
  expectedOutcome: string
}

interface Goal {
  area: string
  objective: string
  activities: string[]
  measurableOutcome: string
  parentRole: string
  childRole: string
}

interface Strategy {
  focus: string
  approach: string
  timeline: string
  milestones: string[]
  parentSupport: string[]
  professionalSupport: string[]
}

interface TherapyRecommendation {
  type: 'CBT' | 'DBT' | 'play-therapy' | 'family-therapy' | 'trauma-informed'
  urgency: 'immediate' | 'within-week' | 'within-month'
  rationale: string
  expectedBenefits: string[]
}

interface InterventionPlan {
  phase: 'assessment' | 'stabilization' | 'treatment' | 'maintenance'
  techniques: string[]
  parentInvolvement: string[]
  schoolCoordination: string[]
  duration: string
}

interface ProgressMetric {
  metric: string
  baseline: number
  target: number
  timeframe: string
  trackingMethod: string
}

export function AdvancedInsightsDashboard({ selectedChildId }: { selectedChildId?: string }) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalysisData()
    
    // Refresh analysis every 5 minutes
    const interval = setInterval(fetchAnalysisData, 300000)
    return () => clearInterval(interval)
  }, [selectedTimeframe, selectedChildId])

  const fetchAnalysisData = async () => {
    try {
      const url = new URL('/api/analysis', window.location.origin)
      url.searchParams.set('type', 'comprehensive')
      url.searchParams.set('days', selectedTimeframe)
      if (selectedChildId) {
        url.searchParams.set('childId', selectedChildId)
      }
      
      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setAnalysisData(data)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-96"></div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-64"></div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-48"></div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-32"></div>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Available</h3>
        <p className="text-gray-600 mb-6">Start a therapy session to generate insights.</p>
        <button 
          onClick={fetchAnalysisData}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Refresh Analysis
        </button>
      </div>
    )
  }

  const { analysis, parentInsights, child } = analysisData

  // Prepare radar chart data for symptom severity
  const symptomRadarData = [
    { symptom: 'Anxiety', level: analysis.symptomSeverity.anxiety.level, fullMark: 10 },
    { symptom: 'Depression', level: analysis.symptomSeverity.depression.level, fullMark: 10 },
    { symptom: 'ADHD', level: analysis.symptomSeverity.adhd.level, fullMark: 10 },
    { symptom: 'Anger', level: analysis.symptomSeverity.anger.level, fullMark: 10 },
    { symptom: 'Trauma', level: analysis.symptomSeverity.trauma.level, fullMark: 10 },
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'crisis': return 'text-red-800 bg-red-100 border-red-300'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'important': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-8">
      {/* Risk Assessment Header */}
      <div className={`rounded-xl p-6 border-2 ${getRiskColor(analysis.overallRiskLevel)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRiskColor(analysis.overallRiskLevel)}`}>
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-poppins)' }}>
                Risk Level: {analysis.overallRiskLevel.charAt(0).toUpperCase() + analysis.overallRiskLevel.slice(1)}
              </h2>
              <p className="text-sm opacity-90">{parentInsights.riskAssessment.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Analysis for {child.name}</p>
            <p className="text-xs opacity-75">Last updated: {new Date(analysisData.analysisTimestamp).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview & Actions', icon: Target },
            { id: 'patterns', label: 'Behavioral Patterns', icon: TrendingUp },
            { id: 'diagnosis', label: 'Clinical Assessment', icon: FileText },
            { id: 'solutions', label: 'Parent Solutions', icon: Zap }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Immediate Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                Immediate Actions Required
              </h3>
              
              {parentInsights.immediateActions.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-medium">No immediate actions required</p>
                  <p className="text-sm text-gray-600">Continue current supportive approach</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parentInsights.immediateActions.map((action, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(action.priority)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{action.title}</h4>
                          <p className="text-sm mb-3">{action.description}</p>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Steps to take:</p>
                            <ul className="text-sm space-y-1">
                              {action.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-start">
                                  <ArrowRight className="h-3 w-3 mt-1 mr-2 flex-shrink-0" />
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="mt-3 flex items-center space-x-4 text-sm">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {action.timeframe}
                            </span>
                            <span className="flex items-center">
                              <Target className="h-3 w-3 mr-1" />
                              {action.expectedOutcome}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Symptom Severity Analysis */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Brain className="h-5 w-5 text-purple-500 mr-2" />
                Symptom Severity Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={symptomRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="symptom" />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} />
                      <Radar
                        name="Severity Level"
                        dataKey="level"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(analysis.symptomSeverity).map(([symptom, data]) => (
                    <div key={symptom} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{symptom}</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          data.level >= 7 ? 'bg-red-100 text-red-800' :
                          data.level >= 5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {data.level}/10
                        </span>
                      </div>
                      {data.symptoms.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium mb-1">Observed symptoms:</p>
                          <ul className="list-disc list-inside space-y-1">
                                                      {data.symptoms.map((symptomText: string, index: number) => (
                            <li key={index}>{symptomText}</li>
                          ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Findings */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                Key Findings
              </h3>
              <div className="space-y-3">
                {parentInsights.keyFindings.map((finding, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{finding}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Recommendation */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 text-blue-500 mr-2" />
                Professional Consultation
              </h3>
              {parentInsights.professionalRecommendation.recommended ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-medium text-blue-800 mb-1">Recommended</p>
                    <p className="text-sm text-blue-700">{parentInsights.professionalRecommendation.type} therapy</p>
                    <p className="text-sm text-blue-600 mt-1">{parentInsights.professionalRecommendation.urgency}</p>
                  </div>
                  <p className="text-sm text-gray-600">{parentInsights.professionalRecommendation.rationale}</p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">{parentInsights.professionalRecommendation.message}</p>
                </div>
              )}
            </div>

            {/* Progress Tracking */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                Progress Tracking
              </h3>
              <div className="space-y-4">
                {parentInsights.progressMetrics.map((metric, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <p className="font-medium text-sm mb-2">{metric.metric}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Current: {metric.baseline}</span>
                      <span>Target: {metric.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((metric.baseline / metric.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Timeline: {metric.timeframe}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <ArrowRight className="h-5 w-5 text-purple-600 mr-2" />
                Next Steps
              </h3>
              <div className="space-y-3">
                {parentInsights.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-purple-700">{index + 1}</span>
                    </div>
                    <p className="text-sm text-purple-800">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs content would go here */}
      {activeTab === 'patterns' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Behavioral Pattern Analysis</h3>
          <p className="text-gray-600">Detailed behavioral pattern analysis coming soon...</p>
        </div>
      )}

      {activeTab === 'diagnosis' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Clinical Assessment</h3>
          <p className="text-gray-600">Professional diagnostic insights coming soon...</p>
        </div>
      )}

      {activeTab === 'solutions' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Parent Solutions & Strategies</h3>
          <p className="text-gray-600">Customized parent guidance coming soon...</p>
        </div>
      )}
    </div>
  )
} 