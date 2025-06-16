import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Demo child UUID - in production, this would come from user session
const DEMO_CHILD_ID = '550e8400-e29b-41d4-a716-446655440001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const childId = searchParams.get('childId') || DEMO_CHILD_ID

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Fetch mood tracking data
    const { data: moodEntries, error } = await supabase
      .from('mood_tracking')
      .select('*')
      .eq('child_id', childId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (error) {
      console.error('Error fetching mood data:', error)
      return NextResponse.json({
        error: 'Failed to fetch mood data'
      }, { status: 500 })
    }

    // Transform data for chart display
    const moodData = moodEntries.map(entry => ({
      date: entry.recorded_at.split('T')[0], // Get just the date part
      happiness: entry.happiness || 5,
      anxiety: entry.anxiety || 5,
      sadness: entry.sadness || 5,
      stress: entry.stress || 5,
      confidence: entry.confidence || 5
    }))

    // If no data, generate some baseline data for the chart
    if (moodData.length === 0) {
      const baselineData = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        baselineData.push({
          date: date.toISOString().split('T')[0],
          happiness: 5,
          anxiety: 5,
          sadness: 5,
          stress: 5,
          confidence: 5
        })
      }
      
      return NextResponse.json({
        moodData: baselineData,
        message: 'No mood data yet - showing baseline'
      })
    }

    // Calculate current mood averages
    const currentMood = {
      happiness: Math.round(moodEntries.reduce((sum, entry) => sum + (entry.happiness || 5), 0) / moodEntries.length),
      anxiety: Math.round(moodEntries.reduce((sum, entry) => sum + (entry.anxiety || 5), 0) / moodEntries.length),
      sadness: Math.round(moodEntries.reduce((sum, entry) => sum + (entry.sadness || 5), 0) / moodEntries.length),
      stress: Math.round(moodEntries.reduce((sum, entry) => sum + (entry.stress || 5), 0) / moodEntries.length),
      confidence: Math.round(moodEntries.reduce((sum, entry) => sum + (entry.confidence || 5), 0) / moodEntries.length)
    }

    return NextResponse.json({
      moodData,
      currentMood,
      totalEntries: moodEntries.length,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    })

  } catch (error) {
    console.error('Error in mood tracking API:', error)
    
    return NextResponse.json({
      error: 'Failed to process mood tracking request'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { childId, happiness, anxiety, sadness, stress, confidence, notes } = await request.json()

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      )
    }

    // Insert mood tracking entry
    const { data: moodEntry, error } = await supabase
      .from('mood_tracking')
      .insert({
        child_id: childId,
        happiness: happiness || 5,
        anxiety: anxiety || 5,
        sadness: sadness || 5,
        stress: stress || 5,
        confidence: confidence || 5,
        notes: notes || '',
        recorded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating mood entry:', error)
      return NextResponse.json(
        { error: 'Failed to save mood data' },
        { status: 500 }
      )
    }

    // Update child's current mood
    const { error: updateError } = await supabase
      .from('children')
      .update({
        current_mood: {
          happiness: happiness || 5,
          anxiety: anxiety || 5,
          sadness: sadness || 5,
          stress: stress || 5,
          confidence: confidence || 5
        }
      })
      .eq('id', childId)

    if (updateError) {
      console.error('Error updating child current mood:', updateError)
    }

    return NextResponse.json({
      success: true,
      moodEntry
    })

  } catch (error) {
    console.error('Error in mood tracking POST:', error)
    
    return NextResponse.json({
      error: 'Failed to process mood tracking entry'
    }, { status: 500 })
  }
} 