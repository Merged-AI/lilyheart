import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Client-side Supabase client (for React components)
export const createClientSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side Supabase client (for API routes)
export const createServerSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Server-side Supabase client with cookie handling (for auth)
export const createServerSupabaseClient = (request: NextRequest, response: NextResponse) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
}

// Custom authentication function that works with auth_token cookie
export async function getAuthenticatedFamilyFromToken() {
  const cookieStore = cookies()
  const authToken = cookieStore.get('auth_token')?.value

  if (!authToken) {
    return null
  }

  try {
    // Decode the token to get family ID
    const decoded = Buffer.from(authToken, 'base64').toString('utf-8')
    const [familyId] = decoded.split(':')
    
    if (!familyId) {
      return null
    }

    // Fetch family data from database
    const supabase = createServerSupabase()
    const { data: family, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single()

    if (error || !family) {
      return null
    }

    return family
  } catch (error) {
    console.error('Error decoding auth token:', error)
    return null
  }
}

// Get authenticated user from cookies (for API routes) - Supabase auth
export async function getAuthenticatedUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  return user
}

// Get family data for authenticated user - Supabase auth
export async function getAuthenticatedFamily() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return null
  }

  const supabase = createServerSupabase()
  const { data: family, error } = await supabase
    .from('families')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !family) {
    return null
  }

  return family
} 