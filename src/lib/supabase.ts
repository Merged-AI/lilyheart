import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Server-side client with service role key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// For demo purposes, we'll use the anon key if service role key is not available
// In production, you MUST set the actual service role key
const adminKey = serviceRoleKey || supabaseAnonKey

if (!serviceRoleKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Using anon key for demo. Please set the service role key for production!')
}

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  adminKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) 