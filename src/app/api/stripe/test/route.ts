import { NextResponse } from 'next/server'
import { stripe, ensureProductAndPrice, PRICING_PLANS } from '@/lib/stripe'

export async function GET() {
  try {
    // Test basic Stripe connection
    const account = await stripe.accounts.retrieve()
    
    // Test product and price creation
    const { product, price } = await ensureProductAndPrice()
    
    return NextResponse.json({
      status: 'success',
      message: 'Stripe integration is working correctly',
      data: {
        account: {
          id: account.id,
          country: account.country,
          default_currency: account.default_currency,
          email: account.email
        },
        product: {
          id: product.id,
          name: product.name,
          description: product.description
        },
        price: {
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          trial_period_days: price.recurring?.trial_period_days
        },
        config: {
          plan_name: PRICING_PLANS.family_coach.name,
          plan_price: `$${PRICING_PLANS.family_coach.price / 100}`,
          plan_features: PRICING_PLANS.family_coach.features.length
        }
      }
    })
  } catch (error: any) {
    console.error('Stripe test error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Stripe integration test failed',
      error: error.code || 'unknown_error'
    }, { status: 500 })
  }
} 