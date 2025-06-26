import { NextResponse } from 'next/server'

export async function GET() {
  const health = {
    status: 'ok' as 'ok' | 'error',
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      stripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    },
    missing: [] as string[]
  }

  // Check for missing critical environment variables
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    health.missing.push('SUPABASE_SERVICE_ROLE_KEY')
    health.status = 'error'
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    health.missing.push('STRIPE_WEBHOOK_SECRET')
    health.status = 'error'
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    health.missing.push('STRIPE_SECRET_KEY')
    health.status = 'error'
  }

  return NextResponse.json(health)
} 