'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, User, Plus } from 'lucide-react'

interface Child {
  id: string
  name: string
  age: number
  current_concerns?: string
  last_session_at?: string
}

interface ChildSelectorProps {
  selectedChildId?: string
  onChildSelect: (childId: string) => void
  onAddChild?: () => void
}

export function ChildSelector({ selectedChildId, onChildSelect, onAddChild }: ChildSelectorProps) {
  const [children, setChildren] = useState<Child[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children')
      if (response.ok) {
        const data = await response.json()
        setChildren(data.children || [])
        
        // Auto-select first child if none selected
        if (!selectedChildId && data.children && data.children.length > 0) {
          onChildSelect(data.children[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedChild = children.find(child => child.id === selectedChildId)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-center">
          <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">No children added yet</p>
          {onAddChild && (
            <button
              onClick={onAddChild}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Add Your First Child
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors w-full min-w-64"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              {selectedChild ? (
                <>
                  <p className="font-medium text-gray-900">{selectedChild.name}</p>
                  <p className="text-sm text-gray-600">{selectedChild.age} years old</p>
                </>
              ) : (
                <p className="font-medium text-gray-900">Select a child</p>
              )}
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  onChildSelect(child.id)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedChildId === child.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedChildId === child.id 
                      ? 'bg-gradient-to-br from-purple-400 to-blue-400' 
                      : 'bg-gray-200'
                  }`}>
                    <User className={`h-4 w-4 ${
                      selectedChildId === child.id ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{child.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{child.age} years old</span>
                      {child.last_session_at && (
                        <>
                          <span>•</span>
                          <span>Last chat: {new Date(child.last_session_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    {child.current_concerns && (
                      <p className="text-xs text-gray-600 mt-1">Focus: {child.current_concerns}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
            
            {onAddChild && children.length < 4 && (
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    onAddChild()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Plus className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-700">Add another child</p>
                      <p className="text-xs text-gray-500">Up to 4 children per family</p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 