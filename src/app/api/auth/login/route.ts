import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find family by email
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('parent_email', email.toLowerCase())
      .single()

    if (familyError || !family) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // In a real app, you'd verify the password hash here
    // For demo purposes, we'll just check if the family exists
    // TODO: Implement proper password hashing and verification

    // Generate session token
    const sessionToken = generateSessionToken(family.id)

    // Set authentication cookie
    const response = NextResponse.json({
      success: true,
      family: {
        id: family.id,
        name: family.family_name,
        parent_name: family.parent_name
      }
    })

    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateSessionToken(familyId: string): string {
  // In a production app, use proper JWT or secure session tokens
  return Buffer.from(`${familyId}:${Date.now()}`).toString('base64')
} 