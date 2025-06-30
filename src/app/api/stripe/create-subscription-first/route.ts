import { NextRequest, NextResponse } from 'next/server'
import { stripe, createOrRetrieveCustomer, ensureProductAndPrice, createSubscription } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { parentName, email, password, familyName, children } = await request.json()

    console.log('Creating Stripe subscription first for:', email)

    // Validate required fields
    if (!parentName || !email || !password || !familyName || !children || children.length === 0) {
      return NextResponse.json(
        { error: 'All family information is required' },
        { status: 400 }
      )
    }

    // Validate children data
    for (const child of children) {
      if (!child.name || !child.age) {
        return NextResponse.json(
          { error: 'Child name and age are required' },
          { status: 400 }
        )
      }
      if (isNaN(Number(child.age)) || Number(child.age) < 3 || Number(child.age) > 18) {
        return NextResponse.json(
          { error: 'Child age must be between 3-18 years' },
          { status: 400 }
        )
      }
    }

    // Ensure Stripe product and price exist
    const { price } = await ensureProductAndPrice()

    // Create Stripe customer with family metadata
    const customer = await createOrRetrieveCustomer(email, parentName)

    // Add family metadata to customer
    await stripe.customers.update(customer.id, {
      metadata: {
        parent_name: parentName,
        family_name: familyName,
        parent_email: email,
        password: password, // We'll use this in webhook to create user
        children_data: JSON.stringify(children),
        platform: 'heart-harbor'
      }
    })

    // Create subscription with 7-day trial
    const subscription = await createSubscription(customer.id, price.id)

    console.log('Stripe subscription created:', subscription.id, 'for customer:', customer.id)

    // Get client secret for payment setup
    let clientSecret = null
    
    // Handle latest_invoice expansion
    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice as any
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        clientSecret = invoice.payment_intent.client_secret
      }
    }
    
    // Handle pending_setup_intent expansion
    if (!clientSecret && subscription.pending_setup_intent && typeof subscription.pending_setup_intent === 'object') {
      const setupIntent = subscription.pending_setup_intent as any
      clientSecret = setupIntent.client_secret
    }

    // Return subscription details - webhook will create user
    return NextResponse.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret,
      email: email,
      trialEnd: subscription.trial_end,
      status: subscription.status,
      message: 'Subscription created! User account will be created after payment confirmation.'
    })

  } catch (error) {
    console.error('Stripe-first subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
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