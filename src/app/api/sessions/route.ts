import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getAuthenticatedFamily, createServerSupabase } from '@/lib/supabase-auth'

interface SessionData {
  userMessage: {
    content: string
    mood?: {
      happiness: number
      anxiety: number
      sadness: number
      stress: number
      confidence: number
    }
  }
  aiMessage: {
    content: string
  }
  sessionDuration: number
}

// Session saving is handled directly in the chat API for better real-time performance

function checkForAlert(mood: any, message: string): boolean {
  // Create alert if high anxiety/stress or low mood
  if (mood.anxiety >= 7 || mood.stress >= 7 || mood.sadness >= 7) {
    return true
  }
  
  // Alert if very low happiness and confidence
  if (mood.happiness <= 2 && mood.confidence <= 2) {
    return true
  }

  // Alert for concerning keywords
  const concerningWords = [
    'hopeless', 'worthless', 'nobody cares', 'hate myself', 
    'can\'t cope', 'too hard', 'give up', 'panic', 'terrified'
  ]
  
  const lowerMessage = message.toLowerCase()
  if (concerningWords.some(word => lowerMessage.includes(word))) {
    return true
  }

  return false
}

// Parent alert functionality is handled in the chat API

function determineAlertLevel(mood: any, message: string): 'high' | 'medium' {
  // High alert for severe symptoms
  if (mood.anxiety >= 8 || mood.sadness >= 8 || mood.stress >= 8) {
    return 'high'
  }
  
  if (mood.happiness <= 1 || mood.confidence <= 1) {
    return 'high'
  }

  // Check for severe language
  const severeWords = ['hopeless', 'worthless', 'hate myself', 'can\'t cope', 'give up']
  const lowerMessage = message.toLowerCase()
  
  if (severeWords.some(word => lowerMessage.includes(word))) {
    return 'high'
  }

  return 'medium'
}

function generateAlertMessage(mood: any, message: string, level: 'high' | 'medium'): string {
  const concerns = []
  
  if (mood.anxiety >= 7) concerns.push('elevated anxiety')
  if (mood.sadness >= 7) concerns.push('significant sadness')
  if (mood.stress >= 7) concerns.push('high stress levels')
  if (mood.confidence <= 3) concerns.push('low self-confidence')

  const concernsText = concerns.length > 0 ? concerns.join(', ') : 'emotional distress'

  if (level === 'high') {
    return `Your child is experiencing ${concernsText} and may need immediate support. Consider scheduling a check-in conversation or contacting a mental health professional. Recent message indicated significant emotional distress.`
  } else {
    return `Your child is showing signs of ${concernsText}. This might be a good time to check in with them about how they're feeling and offer some extra support.`
  }
}

// GET endpoint to retrieve session history
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get family record
    const family = await getAuthenticatedFamily()
    if (!family) {
      return NextResponse.json(
        { error: 'Family record not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const childId = searchParams.get('childId')

    const supabase = createServerSupabase()

    let query = supabase
      .from('therapy_sessions')
      .select(`
        *,
        children!inner(id, name, age, family_id)
      `)
      .eq('children.family_id', family.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by specific child if provided
    if (childId) {
      query = query.eq('child_id', childId)
    }

    const { data: sessions, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      sessions: sessions || []
    })

  } catch (error) {
    console.error('Error fetching sessions:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch sessions'
    }, { status: 500 })
  }
} 