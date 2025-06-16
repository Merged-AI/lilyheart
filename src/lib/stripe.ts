import Stripe from 'stripe'
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Client-side Stripe instance
let stripePromise: Promise<StripeJS | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Heart Harbor pricing configuration
export const PRICING_PLANS = {
  family_coach: {
    name: 'Family Communication Coach',
    description: 'Everything your family needs to build better communication',
    price: 3900, // $39.00 in cents
    currency: 'usd',
    interval: 'month',
    trial_period_days: 7,
    features: [
      'Unlimited AI Conversations (up to 4 family members)',
      'Parent Dashboard with conversation insights',
      'Appointment Preparation Tools',
      '24/7 Emotional Support Companion',
      'Family Progress Tracking',
      'Age-Appropriate AI Coaching (3-18 years)',
      'Crisis Support Resources'
    ]
  }
} as const

// Create or retrieve Stripe customer
export async function createOrRetrieveCustomer(email: string, name: string) {
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      platform: 'heart-harbor'
    }
  })

  return customer
}

// Create subscription with trial
export async function createSubscription(customerId: string, priceId: string) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: PRICING_PLANS.family_coach.trial_period_days,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
  })

  return subscription
}

// Get or create product and price in Stripe
export async function ensureProductAndPrice() {
  // Check if product exists
  const products = await stripe.products.list({
    active: true,
    limit: 100
  })

  let product = products.data.find(p => p.metadata.plan_id === 'family_coach')

  if (!product) {
    // Create product
    product = await stripe.products.create({
      name: PRICING_PLANS.family_coach.name,
      description: PRICING_PLANS.family_coach.description,
      metadata: {
        plan_id: 'family_coach',
        platform: 'heart-harbor'
      }
    })
  }

  // Check if price exists
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100
  })

  let price = prices.data.find(p => 
    p.unit_amount === PRICING_PLANS.family_coach.price &&
    p.recurring?.interval === PRICING_PLANS.family_coach.interval
  )

  if (!price) {
    // Create price
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: PRICING_PLANS.family_coach.price,
      currency: PRICING_PLANS.family_coach.currency,
      recurring: {
        interval: PRICING_PLANS.family_coach.interval,
        trial_period_days: PRICING_PLANS.family_coach.trial_period_days
      },
      metadata: {
        plan_id: 'family_coach'
      }
    })
  }

  return { product, price }
} 