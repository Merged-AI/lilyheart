import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedFamilyFromToken, createServerSupabase } from '@/lib/supabase-auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

// Analyze mood using OpenAI for accurate emotional assessment
async function analyzeMoodFromMessage(userMessage: string, aiResponse: string): Promise<any> {
  try {
    const prompt = `Analyze the emotional state of a child based on their message. Provide a detailed mood analysis with scores from 1-10 for each dimension.

Child's message: "${userMessage}"

Please analyze the emotional content and provide scores for:
- happiness (1=very sad, 10=very happy)
- anxiety (1=very calm, 10=very anxious)
- sadness (1=not sad at all, 10=extremely sad)
- stress (1=very relaxed, 10=extremely stressed)
- confidence (1=very low confidence, 10=very confident)

IMPORTANT: Pay special attention to concerning content like:
- Thoughts of harm to self or others
- Suicidal ideation
- Extreme emotional distress
- Violent thoughts
- Hopelessness

For concerning content, use appropriate high scores for anxiety, sadness, and stress.

Respond with a JSON object only:
{
  "happiness": number,
  "anxiety": number,
  "sadness": number,
  "stress": number,
  "confidence": number,
  "insights": "Brief clinical observation about the emotional state"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a child psychologist specializing in emotional assessment. Provide accurate, nuanced mood analysis based on the child\'s message content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const moodAnalysis = JSON.parse(response)
    
    // Ensure all scores are within 1-10 range
    moodAnalysis.happiness = Math.max(1, Math.min(10, moodAnalysis.happiness || 5))
    moodAnalysis.anxiety = Math.max(1, Math.min(10, moodAnalysis.anxiety || 5))
    moodAnalysis.sadness = Math.max(1, Math.min(10, moodAnalysis.sadness || 5))
    moodAnalysis.stress = Math.max(1, Math.min(10, moodAnalysis.stress || 5))
    moodAnalysis.confidence = Math.max(1, Math.min(10, moodAnalysis.confidence || 5))

    return moodAnalysis

  } catch (error) {
    console.error('Error analyzing mood with OpenAI:', error)
    
    // Return default neutral scores if OpenAI analysis fails
    return {
      happiness: 5,
      anxiety: 5,
      sadness: 5,
      stress: 5,
      confidence: 5,
      insights: "Unable to analyze mood - using neutral baseline scores",
    }
  }
}

// Extract topics from a message for categorization
function extractTopicsFromMessage(message: string): string[] {
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
  if (lowerMessage.includes('family') || lowerMessage.includes('parent') || lowerMessage.includes('sibling') || lowerMessage.includes('brother') || lowerMessage.includes('sister')) {
    topics.push('Family dynamics')
  }
  if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
    topics.push('Sleep issues')
  }
  if (lowerMessage.includes('stressed') || lowerMessage.includes('pressure') || lowerMessage.includes('overwhelmed')) {
    topics.push('Stress management')
  }
  if (lowerMessage.includes('angry') || lowerMessage.includes('mad') || lowerMessage.includes('annoying')) {
    topics.push('Anger management')
  }
  if (lowerMessage.includes('bullying') || lowerMessage.includes('bully') || lowerMessage.includes('mean')) {
    topics.push('Bullying concerns')
  }
  if (lowerMessage.includes('calm') || lowerMessage.includes('breathing') || lowerMessage.includes('relax')) {
    topics.push('Coping strategies')
  }
  
  return topics.length > 0 ? topics : ['General conversation']
}

function checkForAlert(mood: any, message: string): boolean {
  // Check for concerning mood scores
  if (mood.anxiety >= 7 || mood.stress >= 7 || mood.sadness >= 7) {
    return true
  }
  
  // Alert if very low happiness and confidence
  if (mood.happiness <= 2 && mood.confidence <= 2) {
    return true
  }

  return false
}

function determineAlertLevel(mood: any, message: string): 'high' | 'medium' {
  // High alert for severe symptoms
  if (mood.anxiety >= 8 || mood.sadness >= 8 || mood.stress >= 8) {
    return 'high'
  }
  
  if (mood.happiness <= 1 || mood.confidence <= 1) {
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
  const family = await getAuthenticatedFamilyFromToken()
  
  if (!family) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const childId = searchParams.get('childId')

  const supabase = createServerSupabase()
  
  let query = supabase
    .from('therapy_sessions')
    .select(`
      *,
      children!inner(
        id,
        name,
        family_id
      )
    `)
    .eq('children.family_id', family.id)

  if (childId) {
    query = query.eq('child_id', childId)
  }

  const { data: sessions, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }

  // Process sessions to ensure mood analysis is available
  const processedSessions = await Promise.all((sessions || []).map(async (session) => {
    let moodAnalysis = session.mood_analysis

    // Always re-analyze mood from the user message to ensure accuracy
    // This is especially important for detecting concerning content that might have been missed
    if (session.user_message) {
      moodAnalysis = await analyzeMoodFromMessage(session.user_message, session.ai_response || '')
    }

    // Extract topics from the message
    const topics = session.user_message ? extractTopicsFromMessage(session.user_message) : ['General conversation']

    // Check for alerts
    const hasAlert = moodAnalysis ? checkForAlert(moodAnalysis, session.user_message || '') : false
    const alertLevel = hasAlert && moodAnalysis ? determineAlertLevel(moodAnalysis, session.user_message || '') : null
    const alertMessage = hasAlert && moodAnalysis ? generateAlertMessage(moodAnalysis, session.user_message || '', alertLevel as 'high' | 'medium') : null

    return {
      ...session,
      mood_analysis: moodAnalysis,
      topics,
      has_alert: hasAlert,
      alert_level: alertLevel,
      alert_message: alertMessage,
      session_duration: session.session_duration || calculateSessionDuration(session)
    }
  }))

  return NextResponse.json({ sessions: processedSessions })
}

export async function POST(request: NextRequest) {
  const family = await getAuthenticatedFamilyFromToken()
  
  if (!family) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const { childId, messages, moodAnalysis, sessionSummary } = await request.json()

    if (!childId || !messages) {
      return NextResponse.json(
        { error: 'Child ID and messages are required' },
        { status: 400 }
      )
    }

    // Verify child belongs to this family
    const supabase = createServerSupabase()
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('family_id', family.id)
      .eq('is_active', true)
      .single()

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      )
    }

    // Extract user message and AI response from messages
    const userMessage = messages.find((msg: any) => msg.sender === 'child' || msg.role === 'user')?.content || ''
    const aiResponse = messages.find((msg: any) => msg.sender === 'ai' || msg.role === 'assistant')?.content || ''

    // Analyze mood if not provided
    let finalMoodAnalysis = moodAnalysis
    if (!finalMoodAnalysis && userMessage) {
      finalMoodAnalysis = await analyzeMoodFromMessage(userMessage, aiResponse)
    }

    // Extract topics
    const topics = userMessage ? extractTopicsFromMessage(userMessage) : ['General conversation']

    // Check for alerts
    const hasAlert = finalMoodAnalysis ? checkForAlert(finalMoodAnalysis, userMessage) : false
    const alertLevel = hasAlert && finalMoodAnalysis ? determineAlertLevel(finalMoodAnalysis, userMessage) : null
    const alertMessage = hasAlert && finalMoodAnalysis ? generateAlertMessage(finalMoodAnalysis, userMessage, alertLevel as 'high' | 'medium') : null

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from('therapy_sessions')
      .insert({
        child_id: childId,
        messages: messages,
        user_message: userMessage,
        ai_response: aiResponse,
        mood_analysis: finalMoodAnalysis,
        session_summary: sessionSummary || null,
        session_duration: calculateSessionDuration(messages),
        topics: topics,
        has_alert: hasAlert,
        alert_level: alertLevel,
        alert_message: alertMessage,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to save session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: session
    })

  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateSessionDuration(messages: any[]): number {
  if (messages.length < 2) return 0
  
  const firstMessage = new Date(messages[0].timestamp || messages[0].created_at || Date.now())
  const lastMessage = new Date(messages[messages.length - 1].timestamp || messages[messages.length - 1].created_at || Date.now())
  
  return Math.floor((lastMessage.getTime() - firstMessage.getTime()) / 1000)
} 