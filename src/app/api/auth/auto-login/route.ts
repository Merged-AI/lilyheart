import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ status: 'processing' })
  const supabase = createServerSupabaseClient(request, response)

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign in the user to establish session
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    })

    if (authError || !authData.user) {
      console.error('Auto-login failed:', authError)
      return NextResponse.json(
        { error: 'Failed to authenticate' },
        { status: 401 }
      )
    }

    console.log('Auto-login successful for:', email)

    // Return success with session cookies
    const finalResponse = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      message: 'Authentication successful'
    })

    // Copy auth cookies to response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('set-cookie')) {
        finalResponse.headers.set(key, value)
      }
    })

    return finalResponse

  } catch (error) {
    console.error('Auto-login error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    )
  }
} 