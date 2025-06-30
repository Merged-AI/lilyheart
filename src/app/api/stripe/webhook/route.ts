import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
        
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id)
  
  try {
    // Get customer data with metadata
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    
    if (!customer || customer.deleted) {
      console.error('Customer not found for subscription:', subscription.id)
      return
    }

    const metadata = (customer as Stripe.Customer).metadata
    
    // Check if this is a new user creation (has all required metadata)
    if (!metadata.parent_email || !metadata.password || !metadata.family_name) {
      console.log('No user creation metadata found, updating existing family record...')
      
      // Handle existing family (fallback to old behavior)
      const { data: family } = await supabase
        .from('families')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (family) {
        await updateFamilySubscription(subscription)
      }
      return
    }

    console.log('Creating new user from Stripe subscription for:', metadata.parent_email)

    // Parse children data
    let childrenData = []
    try {
      childrenData = JSON.parse(metadata.children_data || '[]')
    } catch (e) {
      console.error('Error parsing children data:', e)
      childrenData = []
    }

    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: metadata.parent_email,
      password: metadata.password,
      email_confirm: true,
      user_metadata: {
        name: metadata.parent_name,
        family_name: metadata.family_name
      }
    })

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError)
      throw new Error('Failed to create user account')
    }

    console.log('Supabase user created:', authUser.user.id)

    // 2. Create family record
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: metadata.family_name,
        family_name: metadata.family_name,
        parent_name: metadata.parent_name,
        parent_email: metadata.parent_email,
        user_id: authUser.user.id,
        subscription_plan: 'family_communication_coach',
        subscription_status: subscription.status,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        subscription_current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : null,
        subscription_current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
      })
      .select()
      .single()

    if (familyError || !family) {
      console.error('Error creating family:', familyError)
      // Clean up auth user if family creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      throw new Error('Failed to create family record')
    }

    console.log('Family record created:', family.id)

    // 3. Create children records
    if (childrenData.length > 0) {
      const childrenRecords = childrenData.map((child: any) => ({
        family_id: family.id,
        name: child.name,
        age: Number(child.age),
        current_concerns: child.concerns || null,
        is_active: true,
        created_at: new Date().toISOString(),
        ai_context: generateChildContext(child)
      }))

      const { error: childrenError } = await supabase
        .from('children')
        .insert(childrenRecords)

      if (childrenError) {
        console.error('Error creating children:', childrenError)
        // Continue anyway - children can be added later
      } else {
        console.log('Children records created:', childrenRecords.length)
      }
    }

    console.log('✅ User account fully created from Stripe subscription!')

  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error)
    // Don't throw - we don't want to break the webhook
  }
}

async function updateFamilySubscription(subscription: Stripe.Subscription) {
  const updateData: any = {
    subscription_status: subscription.status,
  }

  if ((subscription as any).current_period_start) {
    updateData.subscription_current_period_start = new Date((subscription as any).current_period_start * 1000).toISOString()
  }
  if ((subscription as any).current_period_end) {
    updateData.subscription_current_period_end = new Date((subscription as any).current_period_end * 1000).toISOString()
  }

  const { error } = await supabase
    .from('families')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating family subscription status:', error)
  }
}

function generateChildContext(child: any): string {
  const age = Number(child.age)
  const concerns = child.concerns || ''

  return `
CHILD PROFILE FOR DR. EMMA AI:
- Name: ${child.name}
- Age: ${age} years old
- Communication Focus: ${concerns || 'General emotional support and family communication'}

FAMILY COMMUNICATION GOALS:
- Build trust and open communication
- Support emotional expression and vocabulary development
- Create safe space for sharing feelings and experiences
- Help family understand ${child.name}'s unique needs and perspectives

AGE-APPROPRIATE APPROACH FOR ${age}-YEAR-OLD:
${age <= 3 ? 
  '- Use very simple language and concrete concepts\n- Include play-based conversation elements\n- Keep conversations shorter (5-10 minutes)\n- Use lots of validation and encouragement' :
  age <= 6 ? 
  '- Use simple language and concrete concepts\n- Include play-based conversation elements\n- Keep conversations shorter (10-15 minutes)\n- Use lots of validation and encouragement' :
  age <= 10 ?
  '- Use age-appropriate emotional vocabulary\n- Help with problem-solving skills\n- Support peer relationship discussions\n- Balance independence with family connection' :
  age <= 14 ?
  '- Respect growing independence while maintaining connection\n- Support identity development and self-expression\n- Help navigate social complexities\n- Discuss future planning and goal-setting' :
  '- Treat as emerging adult with respect for autonomy\n- Support college/career planning discussions\n- Help with complex emotional and relationship topics\n- Encourage critical thinking and decision-making skills'
}

CONVERSATION FOCUS AREAS:
${concerns ? `- Specific family interest: ${concerns}` : '- General emotional wellness and communication'}
- Daily emotional check-ins and mood awareness
- Stress management and coping strategies
- Family relationships and communication skills
- School/academic experiences and social relationships
- Building confidence and self-esteem

INSTRUCTIONS FOR DR. EMMA:
- Always use ${child.name}'s name to create personal connection
- Adapt language and concepts for ${age}-year-old developmental level
- Focus on building communication skills rather than diagnosing
- Help family understand patterns and support emotional growth
- Create safe, judgment-free space for expression
`
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id)
  
  const updateData: any = {
    subscription_status: subscription.status,
  }

  // Only add timestamp fields if they exist
  if ((subscription as any).current_period_start) {
    updateData.subscription_current_period_start = new Date((subscription as any).current_period_start * 1000).toISOString()
  }
  if ((subscription as any).current_period_end) {
    updateData.subscription_current_period_end = new Date((subscription as any).current_period_end * 1000).toISOString()
  }

  // Handle trial end
  if ((subscription as any).trial_end) {
    updateData.trial_ends_at = new Date((subscription as any).trial_end * 1000).toISOString()
  }

  const { error } = await supabase
    .from('families')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating family subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)
  
  // Mark subscription as canceled
  const { error } = await supabase
    .from('families')
    .update({
      subscription_status: 'canceled',
      subscription_canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error marking subscription as canceled:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id)
  
  const subscriptionId = (invoice as any).subscription
  if (subscriptionId) {
    // Update family payment status
    const { error } = await supabase
      .from('families')
      .update({
        last_payment_at: new Date().toISOString(),
        subscription_status: 'active'
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating payment success:', error)
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id)
  
  const subscriptionId = (invoice as any).subscription
  if (subscriptionId) {
    // Update family with payment failure
    const { error } = await supabase
      .from('families')
      .update({
        subscription_status: 'past_due',
        last_payment_failed_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating payment failure:', error)
    }
  }
} 