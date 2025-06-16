import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getAuthenticatedFamily, createServerSupabase } from '@/lib/supabase-auth'
import { enhancedChatAnalyzer } from '@/lib/enhanced-chat-analysis'

// Get the most recent active child from the authenticated family
async function getMostRecentChild(familyId: string): Promise<string | null> {
  try {
    const supabase = createServerSupabase()
    const { data: child, error } = await supabase
      .from('children')
      .select('id')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !child) {
      return null
    }

    return child.id
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and family
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const family = await getAuthenticatedFamily()
    if (!family) {
      return NextResponse.json(
        { error: 'No family found. Please complete your profile first.' },
        { status: 404 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeframeDays = parseInt(searchParams.get('days') || '30')
    const childId = searchParams.get('childId')

    // Determine which child to analyze
    let targetChildId = childId
    if (!targetChildId) {
      targetChildId = await getMostRecentChild(family.id)
    }

    if (!targetChildId) {
      return NextResponse.json(
        { 
          error: 'No active children found. Please register a child first.',
          requiresChildRegistration: true
        },
        { status: 404 }
      )
    }

    // Generate enhanced analysis
    const analysis = await enhancedChatAnalyzer.generateComprehensiveAnalysis(
      targetChildId, 
      timeframeDays
    )

    // Get child details for additional context
    const supabase = createServerSupabase()
    const { data: child } = await supabase
      .from('children')
      .select('name, age, current_concerns, parent_goals')
      .eq('id', targetChildId)
      .single()

    return NextResponse.json({
      success: true,
      childId: targetChildId,
      childInfo: child,
      analysis
    })

  } catch (error) {
    console.error('Error in enhanced analysis API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 