import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const serverSupabase = createServerSupabase()

    // Check if user exists in auth.users
    const { data: authUsers, error: authError } = await serverSupabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error checking auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to check user status' },
        { status: 500 }
      )
    }

    const user = authUsers.users.find(u => u.email === email.toLowerCase())
    
    if (!user) {
      // User not created yet
      return NextResponse.json(
        { exists: false, message: 'User not created yet' },
        { status: 404 }
      )
    }

    // Check if family record exists
    const { data: family, error: familyError } = await serverSupabase
      .from('families')
      .select('id, user_id')
      .eq('user_id', user.id)
      .single()

    if (familyError || !family) {
      // Family not created yet
      return NextResponse.json(
        { exists: false, message: 'Family record not created yet' },
        { status: 404 }
      )
    }

    // User and family both exist - ready!
    return NextResponse.json({
      exists: true,
      userId: user.id,
      familyId: family.id,
      email: user.email,
      message: 'User account ready'
    })

  } catch (error) {
    console.error('Check user error:', error)
    return NextResponse.json(
      { error: 'Failed to check user status' },
      { status: 500 }
    )
  }
} 