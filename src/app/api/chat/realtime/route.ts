import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Crisis detection keywords
const CRISIS_KEYWORDS = [
  "hurt myself",
  "kill myself",
  "want to die",
  "end it all",
  "suicide",
  "suicidal",
  "cut myself",
  "harm myself",
  "better off dead",
  "can't go on",
  "no point living",
  "hurt me",
  "hit me",
  "touched inappropriately",
  "abuse",
  "sexual abuse",
];

function detectCrisis(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lowerMessage.includes(keyword));
}

function generateCrisisResponse(): string {
  return `I'm really concerned about what you just shared with me. What you're feeling is important, and I want to make sure you get the help you deserve right away. 

It's so brave of you to tell me about this. You're not alone, and there are people who care about you and want to help.

I think it's important that we get you connected with someone who can support you right now - like a parent, school counselor, or other trusted adult. 

If you're having thoughts of hurting yourself, please reach out to:
- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 988
- Or go to your nearest emergency room

You matter, and your life has value. Please don't give up. 💜`;
}

// Verify that child belongs to the authenticated family
async function verifyChildBelongsToFamily(
  childId: string,
  familyId: string
): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select("id, family_id")
      .eq("id", childId)
      .eq("family_id", familyId)
      .eq("is_active", true)
      .single();

    if (error || !child) {
      console.error("Error verifying child belongs to family:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in verifyChildBelongsToFamily:", error);
    return false;
  }
}

// Verify that child has completed comprehensive therapeutic profile
async function verifyChildProfileComplete(childId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select(
        "name, current_concerns, parent_goals, reason_for_adding, profile_completed"
      )
      .eq("id", childId)
      .single();

    if (error || !child) {
      console.error("Error verifying child profile:", error);
      return false;
    }

    // Check if essential therapeutic fields are completed
    const hasRequiredFields = !!(
      child.name?.trim() &&
      child.current_concerns?.trim() &&
      child.parent_goals?.trim() &&
      child.reason_for_adding?.trim()
    );

    // Also check the profile_completed flag if it exists
    const isMarkedComplete = child.profile_completed === true;

    return hasRequiredFields && isMarkedComplete;
  } catch (error) {
    console.error("Error in verifyChildProfileComplete:", error);
    return false;
  }
}

// Get child's background context for personalized therapy
async function getChildContext(childId: string): Promise<string> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select(
        "name, age, gender, current_concerns, triggers, parent_goals, reason_for_adding"
      )
      .eq("id", childId)
      .single();

    if (error || !child) {
      console.error("Error fetching child context:", error);
      return `
CHILD PROFILE FOR DR. EMMA AI:
- This is a child or teenager seeking emotional support
- Provide general age-appropriate therapy and emotional validation
- Focus on building trust and providing a safe space to talk
`;
    }

    return generateChildContext({
      name: child.name,
      age: child.age,
      gender: child.gender,
      currentConcerns: child.current_concerns,
      triggers: child.triggers,
      parentGoals: child.parent_goals,
      reasonForAdding: child.reason_for_adding,
    });
  } catch (error) {
    console.error("Error in getChildContext:", error);
    return "";
  }
}

// Comprehensive child context generation function
function generateChildContext(child: any): string {
  const age = Number(child.age);
  const name = child.name;
  const currentConcerns = child.currentConcerns || "";
  const triggers = child.triggers || "";
  const parentGoals = child.parentGoals || "";
  const reasonForAdding = child.reasonForAdding || "";
  const gender = child.gender || "";

  return `
COMPREHENSIVE CHILD PROFILE FOR DR. EMMA AI:

BASIC INFORMATION:
- Name: ${name}
- Age: ${age} years old
- Gender: ${gender || "Not specified"}
- Reason for therapy: ${reasonForAdding}

CURRENT MENTAL HEALTH CONCERNS:
${currentConcerns}

KNOWN TRIGGERS & STRESSORS:
${triggers || "No specific triggers identified yet"}

PARENT/GUARDIAN THERAPEUTIC GOALS:
${parentGoals}

THERAPEUTIC APPROACH FOR ${name}:
${
  age <= 8
    ? `- Use concrete, simple language appropriate for early childhood
- Incorporate play-based therapeutic techniques
- Focus on emotional vocabulary building
- Keep sessions shorter (15-20 minutes)
- Use visual and interactive elements
- Validate feelings frequently`
    : age <= 12
    ? `- Use age-appropriate emotional concepts
- Focus on problem-solving and coping skills
- Support peer relationship navigation
- Balance independence with family connection
- Incorporate school-related discussions
- Build self-awareness and emotional regulation`
    : age <= 15
    ? `- Respect growing independence and identity development
- Address social complexities and peer pressure
- Support identity formation and self-expression
- Discuss future planning and goal-setting
- Navigate family relationship changes
- Build critical thinking about emotions and relationships`
    : `- Treat as emerging adult with respect for autonomy
- Support transition to adulthood planning
- Address complex emotional and relationship topics
- Encourage independent decision-making
- Discuss future goals and aspirations
- Support family relationship evolution`
}

KEY THERAPEUTIC FOCUS AREAS FOR ${name}:
- Primary concerns: ${currentConcerns}
- Trigger awareness: ${
    triggers
      ? `Be mindful of: ${triggers}`
      : "Monitor for emotional triggers during conversations"
  }
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
`;
}

export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get("upgrade");

  if (upgrade !== "websocket") {
    return NextResponse.json(
      {
        error: "WebSocket connection required for real-time voice chat",
      },
      { status: 400 }
    );
  }

  // For now, return a message indicating that WebSocket support needs to be implemented
  // In a production environment, you would need to use a WebSocket server like Socket.IO
  // or implement WebSocket handling with a library like 'ws'

  return NextResponse.json({
    message:
      "Real-time voice chat with gpt-4o-realtime-preview requires WebSocket implementation",
    note: "Consider using Socket.IO or a similar WebSocket library for full real-time functionality",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, childId, messageHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!childId) {
      return NextResponse.json(
        { error: "Child ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated family
    const family = await getAuthenticatedFamilyFromToken();
    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify that the child belongs to the authenticated family
    const childBelongsToFamily = await verifyChildBelongsToFamily(
      childId,
      family.id
    );
    if (!childBelongsToFamily) {
      return NextResponse.json(
        { error: "Child not found or access denied" },
        { status: 403 }
      );
    }

    // Verify child has complete therapeutic profile
    const isProfileComplete = await verifyChildProfileComplete(childId);
    if (!isProfileComplete) {
      return NextResponse.json(
        {
          error:
            "Child profile incomplete. Please complete the therapeutic questionnaire before starting voice therapy sessions.",
          requiresProfileCompletion: true,
          childId: childId,
        },
        { status: 422 }
      );
    }

    // Check for crisis content
    if (detectCrisis(message)) {
      return NextResponse.json({
        success: true,
        response: generateCrisisResponse(),
        crisis: true,
      });
    }

    // Get child context
    const childContext = await getChildContext(childId);

    // Prepare conversation history
    const conversationHistory = messageHistory.slice(-10).map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Use OpenAI Realtime API (simulated for now since we need WebSocket)
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Fallback to gpt-4o-mini for now
        messages: [
          {
            role: "system",
            content: `You are Dr. Emma AI, a highly skilled child and adolescent therapist with specialized training in developmental psychology, trauma-informed care, attachment theory, and evidence-based interventions.

CHILD-SPECIFIC CONTEXT:
${childContext}

CRITICAL INSTRUCTION: Use the child's actual name from the CHILD-SPECIFIC CONTEXT above in your responses when appropriate.

REALTIME VOICE CHAT GUIDELINES:
- Keep responses concise but meaningful for voice interaction
- Maintain natural conversation flow
- Be warm, empathetic, and age-appropriate
- Focus on the child's specific concerns and background
- Monitor for crisis indicators and respond appropriately
- Use therapeutic techniques appropriate for the child's age and concerns

THERAPEUTIC FOCUS FOR THIS CHILD:
- PROACTIVELY check in about family dynamics and sibling relationships
- Ask gentle questions about school situations and friendships
- Guide conversations toward emotional awareness before anger builds up
- When child shows frustration, explore the feelings underneath
- Normalize their big feelings while teaching regulation techniques
- Help them identify their triggers in a developmentally appropriate way
- Practice coping strategies through natural conversation (breathing, counting, etc.)
- Build self-esteem and confidence around their strengths

Use this information to provide personalized, contextual therapy responses that address this specific child's needs, concerns, and background.`,
          },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        max_tokens: 200,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const aiResponse = completion.choices[0]?.message?.content || "";

      return NextResponse.json({
        success: true,
        response: aiResponse,
        model: "gpt-4o-mini", // Note: using fallback model
      });
    } catch (error) {
      console.error("Error with OpenAI API:", error);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in realtime chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
