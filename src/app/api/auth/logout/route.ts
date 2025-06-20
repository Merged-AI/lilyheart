import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  // Clear the custom auth token cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/'
  })

  // Clear Supabase session cookies
  const supabase = createServerSupabaseClient(request, response)
  await supabase.auth.signOut()

  return response
} 