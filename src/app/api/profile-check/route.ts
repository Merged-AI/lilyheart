import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getAuthenticatedFamily, createServerSupabase } from '@/lib/supabase-auth'

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

// Verify that child has completed comprehensive therapeutic profile
async function verifyChildProfileComplete(childId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabase()
    const { data: child, error } = await supabase
      .from('children')
      .select('name, current_concerns, parent_goals, reason_for_adding, profile_completed')
      .eq('id', childId)
      .single()

    if (error || !child) {
      return false
    }

    // Check if essential therapeutic fields are completed
    const hasRequiredFields = !!(
      child.name?.trim() &&
      child.current_concerns?.trim() &&
      child.parent_goals?.trim() &&
      child.reason_for_adding?.trim()
    )

    // Also check the profile_completed flag if it exists
    const isMarkedComplete = child.profile_completed === true

    return hasRequiredFields && isMarkedComplete
  } catch (error) {
    return false
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

    // Get most recent child ID
    const childId = await getMostRecentChild(family.id)
    
    if (!childId) {
      return NextResponse.json(
        { 
          error: 'No active children found. Please register a child first.',
          requiresChildRegistration: true
        },
        { status: 404 }
      )
    }

    // Verify child has complete therapeutic profile
    const isProfileComplete = await verifyChildProfileComplete(childId)
    
    if (!isProfileComplete) {
      return NextResponse.json(
        { 
          error: 'Child profile incomplete. Please complete the therapeutic questionnaire before starting therapy sessions.',
          requiresProfileCompletion: true,
          childId: childId
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      profileComplete: true,
      childId: childId
    })

  } catch (error) {
    console.error('Error in profile check API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 