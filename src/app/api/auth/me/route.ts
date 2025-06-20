import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedFamilyFromToken, createServerSupabase } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const family = await getAuthenticatedFamilyFromToken()
    
    if (!family) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch children for this family
    const supabase = createServerSupabase()
    const { data: children } = await supabase
      .from('children')
      .select('id, name, age, current_concerns')
      .eq('family_id', family.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      family: {
        id: family.id,
        family_name: family.family_name,
        parent_name: family.parent_name,
        parent_email: family.parent_email,
        subscription_plan: family.subscription_plan,
        subscription_status: family.subscription_status,
        trial_ends_at: family.trial_ends_at
      },
      children: children || []
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 