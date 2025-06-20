import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedFamilyFromToken, createServerSupabase } from '@/lib/supabase-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  const family = await getAuthenticatedFamilyFromToken()
  
  if (!family) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const supabase = createServerSupabase()
  const { data: child, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', params.childId)
    .eq('family_id', family.id)
    .eq('is_active', true)
    .single()

  if (error || !child) {
    return NextResponse.json(
      { error: 'Child not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ child })
} 