import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedFamily, createServerSupabase } from '@/lib/supabase-auth'

// GET: Fetch all children for the authenticated family
export async function GET(request: NextRequest) {
  try {
    const family = await getAuthenticatedFamily()
    
    if (!family) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabase()
    const { data: children, error } = await supabase
      .from('children')
      .select('*')
      .eq('family_id', family.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching children:', error)
      return NextResponse.json(
        { error: 'Failed to fetch children' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      children: children || []
    })

  } catch (error) {
    console.error('Children API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Add a new child to the family
export async function POST(request: NextRequest) {
  try {
    const family = await getAuthenticatedFamily()
    
    if (!family) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const {
      name,
      age,
      gender,
      background,
      currentConcerns,
      triggers,
      copingStrategies,
      previousTherapy,
      schoolInfo,
      familyDynamics,
      socialSituation,
      reasonForAdding,
      parentGoals,
      emergencyContacts
    } = await request.json()

    // Validate required fields for therapeutic profile
    if (!name || !age || !reasonForAdding || !currentConcerns || !parentGoals) {
      return NextResponse.json(
        { error: 'Name, age, reason for adding, current concerns, and parent goals are required for effective therapy' },
        { status: 400 }
      )
    }

    if (isNaN(Number(age)) || Number(age) < 6 || Number(age) > 18) {
      return NextResponse.json(
        { error: 'Age must be between 6-18 years for this therapeutic system' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    // Check if family already has 4 children (plan limit)
    const { data: existingChildren } = await supabase
      .from('children')
      .select('id')
      .eq('family_id', family.id)
      .eq('is_active', true)

    if (existingChildren && existingChildren.length >= 4) {
      return NextResponse.json(
        { error: 'Maximum 4 children per family' },
        { status: 400 }
      )
    }

    // Create new child with comprehensive therapeutic profile
    const { data: newChild, error } = await supabase
      .from('children')
      .insert({
        family_id: family.id,
        name: name.trim(),
        age: Number(age),
        gender: gender?.trim() || null,
        background: background?.trim() || null,
        current_concerns: currentConcerns?.trim() || null,
        triggers: triggers?.trim() || null,
        coping_strategies: copingStrategies?.trim() || null,
        previous_therapy: previousTherapy?.trim() || null,
        school_info: schoolInfo?.trim() || null,
        family_dynamics: familyDynamics?.trim() || null,
        social_situation: socialSituation?.trim() || null,
        reason_for_adding: reasonForAdding?.trim() || null,
        parent_goals: parentGoals?.trim() || null,
        emergency_contacts: emergencyContacts?.trim() || null,
        is_active: true,
        profile_completed: true, // Mark as complete since all required fields are provided
        created_at: new Date().toISOString(),
        ai_context: generateChildContext({
          name: name.trim(),
          age: Number(age),
          gender: gender?.trim(),
          currentConcerns: currentConcerns?.trim(),
          triggers: triggers?.trim(),
          parentGoals: parentGoals?.trim(),
          reasonForAdding: reasonForAdding?.trim()
        })
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating child:', error)
      return NextResponse.json(
        { error: 'Failed to create child' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      child: newChild
    })

  } catch (error) {
    console.error('Add child error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateChildContext(child: any): string {
  const age = Number(child.age)
  const name = child.name
  const currentConcerns = child.currentConcerns || ''
  const triggers = child.triggers || ''
  const parentGoals = child.parentGoals || ''
  const reasonForAdding = child.reasonForAdding || ''
  const gender = child.gender || ''

  return `
COMPREHENSIVE CHILD PROFILE FOR DR. EMMA AI:

BASIC INFORMATION:
- Name: ${name}
- Age: ${age} years old
- Gender: ${gender || 'Not specified'}
- Reason for therapy: ${reasonForAdding}

CURRENT MENTAL HEALTH CONCERNS:
${currentConcerns}

KNOWN TRIGGERS & STRESSORS:
${triggers || 'No specific triggers identified yet'}

PARENT/GUARDIAN THERAPEUTIC GOALS:
${parentGoals}

THERAPEUTIC APPROACH FOR ${name}:
${age <= 8 ? 
  `- Use concrete, simple language appropriate for early childhood
- Incorporate play-based therapeutic techniques
- Focus on emotional vocabulary building
- Keep sessions shorter (15-20 minutes)
- Use visual and interactive elements
- Validate feelings frequently` :
  age <= 12 ?
  `- Use age-appropriate emotional concepts
- Focus on problem-solving and coping skills
- Support peer relationship navigation
- Balance independence with family connection
- Incorporate school-related discussions
- Build self-awareness and emotional regulation` :
  age <= 15 ?
  `- Respect growing independence and identity development
- Address social complexities and peer pressure
- Support identity formation and self-expression
- Discuss future planning and goal-setting
- Navigate family relationship changes
- Build critical thinking about emotions and relationships` :
  `- Treat as emerging adult with respect for autonomy
- Support transition to adulthood planning
- Address complex emotional and relationship topics
- Encourage independent decision-making
- Discuss future goals and aspirations
- Support family relationship evolution`
}

KEY THERAPEUTIC FOCUS AREAS FOR ${name}:
- Primary concerns: ${currentConcerns}
- Trigger awareness: ${triggers ? `Be mindful of: ${triggers}` : 'Monitor for emotional triggers during conversations'}
- Parent goals: ${parentGoals}
- Age-appropriate emotional development support
- Building healthy coping mechanisms
- Strengthening family communication

CONVERSATION GUIDELINES FOR ${name}:
- Always use their name to create personal connection
- Reference their specific concerns and background
- Avoid or carefully approach known triggers
- Work toward parent-identified goals
- Adapt all interventions for ${age}-year-old developmental stage
- Create trauma-informed, safe therapeutic space
- Focus on strengths-based approach while addressing concerns
- Monitor for crisis indicators and escalate appropriately

THERAPEUTIC RELATIONSHIP BUILDING:
- Establish trust through consistency and understanding
- Show genuine interest in ${name}'s unique perspective
- Validate their experiences while providing gentle guidance
- Help them feel heard and understood
- Build therapeutic alliance before deeper therapeutic work
`
}

 