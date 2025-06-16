'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, User, Heart, AlertTriangle, Calendar, FileText, ArrowLeft, Save } from 'lucide-react'

interface ChildData {
  name: string
  age: number
  gender: string
  background: string
  currentConcerns: string
  triggers: string
  copingStrategies: string
  previousTherapy: string
  schoolInfo: string
  familyDynamics: string
  socialSituation: string
  reasonForAdding: string
  parentGoals: string
  emergencyContacts: string
}

export default function AddChildPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const [childData, setChildData] = useState<ChildData>({
    name: '',
    age: 0,
    gender: '',
    background: '',
    currentConcerns: '',
    triggers: '',
    copingStrategies: '',
    previousTherapy: '',
    schoolInfo: '',
    familyDynamics: '',
    socialSituation: '',
    reasonForAdding: '',
    parentGoals: '',
    emergencyContacts: ''
  })

  const handleInputChange = (field: keyof ChildData, value: string | number) => {
    setChildData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/dashboard?childAdded=${result.childId}`)
      } else {
        throw new Error('Failed to add child')
      }
    } catch (error) {
      console.error('Error adding child:', error)
      alert('Failed to add child. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Child's Name *
                </label>
                <input
                  type="text"
                  value={childData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Enter your child's name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  min="6"
                  max="18"
                  value={childData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Age"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Gender
                </label>
                <select
                  value={childData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Why are you adding your child to Heart Harbor? *
              </label>
              <textarea
                value={childData.reasonForAdding}
                onChange={(e) => handleInputChange('reasonForAdding', e.target.value)}
                rows={4}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Help us understand what brought you here - anxiety, social issues, behavioral concerns, school stress, etc."
                required
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
              Current Concerns & Background
            </h2>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Current Mental Health Concerns *
              </label>
              <textarea
                value={childData.currentConcerns}
                onChange={(e) => handleInputChange('currentConcerns', e.target.value)}
                rows={4}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Describe any anxiety, depression, mood swings, behavioral issues, or other concerns you've noticed"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Known Triggers
              </label>
              <textarea
                value={childData.triggers}
                onChange={(e) => handleInputChange('triggers', e.target.value)}
                rows={3}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="What situations, events, or topics tend to upset or stress your child?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Background & Experiences
              </label>
              <textarea
                value={childData.background}
                onChange={(e) => handleInputChange('background', e.target.value)}
                rows={4}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Any significant events, trauma, changes, or experiences that might be relevant to your child's mental health"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Previous Therapy or Treatment
              </label>
              <textarea
                value={childData.previousTherapy}
                onChange={(e) => handleInputChange('previousTherapy', e.target.value)}
                rows={3}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Has your child seen a therapist, counselor, or taken medication? What worked or didn't work?"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
              Social & Family Context
            </h2>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                School Situation
              </label>
              <textarea
                value={childData.schoolInfo}
                onChange={(e) => handleInputChange('schoolInfo', e.target.value)}
                rows={3}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="How is school going? Any issues with grades, teachers, bullying, or academic pressure?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Social Relationships
              </label>
              <textarea
                value={childData.socialSituation}
                onChange={(e) => handleInputChange('socialSituation', e.target.value)}
                rows={3}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="How are your child's friendships? Any social anxiety, conflicts, or isolation issues?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Family Dynamics
              </label>
              <textarea
                value={childData.familyDynamics}
                onChange={(e) => handleInputChange('familyDynamics', e.target.value)}
                rows={3}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Family structure, relationships, any recent changes like divorce, moves, new siblings, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Current Coping Strategies
              </label>
              <textarea
                value={childData.copingStrategies}
                onChange={(e) => handleInputChange('copingStrategies', e.target.value)}
                rows={3}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="What does your child do now when they're upset? What helps them feel better?"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
              Goals & Emergency Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Your Goals for Therapy *
              </label>
              <textarea
                value={childData.parentGoals}
                onChange={(e) => handleInputChange('parentGoals', e.target.value)}
                rows={4}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="What do you hope Dr. Emma can help your child with? What would success look like?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Emergency Contacts
              </label>
              <textarea
                value={childData.emergencyContacts}
                onChange={(e) => handleInputChange('emergencyContacts', e.target.value)}
                rows={3}
                className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="Who should be contacted in an emergency? Include names, relationships, and phone numbers."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Brain className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">How Dr. Emma Will Use This Information</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Dr. Emma AI will use this background to provide personalized, context-aware therapy. She'll understand your child's unique situation, avoid known triggers, and focus on areas you've identified as important. All information is kept completely private and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return childData.name.trim() && childData.age > 0 && childData.reasonForAdding.trim()
      case 2:
        return childData.currentConcerns.trim()
      case 3:
        return true // All fields optional
      case 4:
        return childData.parentGoals.trim()
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-purple-600 hover:text-purple-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-purple-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Add Child to Heart Harbor
                  </h1>
                  <p className="text-sm text-purple-600">
                    Step {currentStep} of {totalSteps}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="bg-white rounded-lg p-1">
          <div className="flex items-center">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className={`w-full h-2 rounded-full ${
                  i + 1 <= currentStep ? 'bg-purple-500' : 'bg-gray-200'
                }`} />
                {i < totalSteps - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-purple-300 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-4">
              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Adding Child...' : 'Add Child & Start Therapy'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 