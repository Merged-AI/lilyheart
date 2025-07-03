import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedFamilyFromToken, createServerSupabase } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated family
    const family = await getAuthenticatedFamilyFromToken()
    console.log('Family from token:', family ? 'Found' : 'Not found')
    if (!family) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // Fetch family with children to verify child belongs to family
    const { data: familyWithChildren, error: familyError } = await supabase
      .from('families')
      .select(`
        *,
        children!inner(
          id,
          name,
          family_id
        )
      `)
      .eq('id', family.id)
      .single()

    if (familyError || !familyWithChildren) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Verify the child belongs to the family
    const childBelongsToFamily = familyWithChildren.children?.some((child: { id: string }) => child.id === childId)
    if (!childBelongsToFamily) {
      return NextResponse.json({ error: 'Child not found in family' }, { status: 404 })
    }

    // Fetch sessions for the child
    const { data: sessions, error: sessionsError } = await supabase
      .from('therapy_sessions')
      .select(`
        id,
        child_id,
        created_at,
        session_duration,
        mood_analysis,
        topics,
        user_message,
        ai_response
      `)
      .eq('child_id', childId)
      .order('created_at', { ascending: false })

    console.log('sessions :', sessions)

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Transform sessions to match the expected format
    const transformedSessions = sessions.map((session: any) => {
      const moodAnalysis = session.mood_analysis || {
        happiness: 5,
        anxiety: 5,
        sadness: 5,
        stress: 5,
        confidence: 5,
        insights: "No mood analysis available"
      }

      // Calculate end time (assuming session duration is in seconds)
      const startTime = new Date(session.created_at)
      const endTime = new Date(startTime.getTime() + (session.session_duration || 0) * 1000)

      // Count messages (user message + AI response)
      const messageCount = 2 // Basic count, could be enhanced to count actual messages

      // Extract key topics
      const keyTopics = session.topics || ['General conversation']

      // Check for alerts based on mood analysis
      const hasAlert = moodAnalysis.anxiety >= 7 || moodAnalysis.stress >= 7 || moodAnalysis.sadness >= 7 || 
                      (moodAnalysis.happiness <= 2 && moodAnalysis.confidence <= 2)
      
      // Generate summary based on available data
      const summary = `Therapy session focusing on ${keyTopics.join(', ').toLowerCase()}. ${hasAlert ? 'Session included crisis alerts.' : 'Session completed normally.'}`

      return {
        id: session.id,
        childId: session.child_id,
        userMessage: session.user_message,
        aiResponse: session.ai_response,
        startTime: session.created_at,
        endTime: endTime.toISOString(),
        duration: session.session_duration || 0,
        messageCount,
        moodAnalysis: {
          happiness: moodAnalysis.happiness || 5,
          anxiety: moodAnalysis.anxiety || 5,
          sadness: moodAnalysis.sadness || 5,
          stress: moodAnalysis.stress || 5,
          confidence: moodAnalysis.confidence || 5,
          insights: moodAnalysis.insights || "No insights available"
        },
        crisisAlerts: hasAlert ? 1 : 0,
        keyTopics,
        summary
      }
    })

    return NextResponse.json({
      sessions: transformedSessions,
      total: transformedSessions.length
    })

  } catch (error) {
    console.error('Error in chat sessions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 