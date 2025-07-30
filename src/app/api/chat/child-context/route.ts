import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedFamilyFromToken, createServerSupabase } from "@/lib/supabase-auth";

// Get child's background context for personalized therapy
async function getChildContext(childId: string): Promise<string> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select(
        "name, age, gender, current_concerns, triggers, parent_goals, reason_for_adding, background, family_dynamics, social_situation, school_info, coping_strategies, previous_therapy, interests, emergency_contacts"
      )
      .eq("id", childId)
      .single();

    if (error || !child) {
      console.error("Error fetching child context:", error);
      return "This is a child seeking emotional support. Provide general age-appropriate therapy and emotional validation.";
    }

    return generateChildContext({
      name: child.name,
      age: child.age,
      gender: child.gender,
      currentConcerns: child.current_concerns,
      triggers: child.triggers,
      parentGoals: child.parent_goals,
      reasonForAdding: child.reason_for_adding,
      background: child.background,
      familyDynamics: child.family_dynamics,
      socialSituation: child.social_situation,
      schoolInfo: child.school_info,
      copingStrategies: child.coping_strategies,
      previousTherapy: child.previous_therapy,
      interests: child.interests,
      emergencyContacts: child.emergency_contacts,
    });
  } catch (error) {
    console.error("Error in getChildContext:", error);
    return "This is a child seeking emotional support. Provide general age-appropriate therapy and emotional validation.";
  }
}

// Generate child context for realtime API
function generateChildContext(child: any): string {
  const age = Number(child.age);
  const name = child.name;
  const currentConcerns = child.currentConcerns || "";
  const triggers = child.triggers || "";
  const parentGoals = child.parentGoals || "";
  const reasonForAdding = child.reasonForAdding || "";
  const background = child.background || "";
  const familyDynamics = child.familyDynamics || "";
  const socialSituation = child.socialSituation || "";
  const schoolInfo = child.schoolInfo || "";
  const copingStrategies = child.copingStrategies || "";
  const previousTherapy = child.previousTherapy || "";
  const interests = child.interests || "";
  const emergencyContacts = child.emergencyContacts || "";

  return `
COMPREHENSIVE CHILD PROFILE FOR DR. EMMA AI:

🚨 CHILD NAME: ${name} - YOU MUST USE THIS NAME IN YOUR RESPONSES

BASIC INFORMATION:
- Name: ${name}
- Age: ${age} years old
- Gender: ${child.gender || "Not specified"}
- Reason for therapy: ${reasonForAdding}

CURRENT MENTAL HEALTH CONCERNS:
${currentConcerns}

KNOWN TRIGGERS & STRESSORS:
${triggers || "No specific triggers identified yet"}

PARENT/GUARDIAN THERAPEUTIC GOALS:
${parentGoals}

PERSONAL BACKGROUND & EXPERIENCES:
${background || "No significant background events noted"}

FAMILY DYNAMICS & RECENT CHANGES:
${familyDynamics || "No specific family dynamics noted"}

SOCIAL RELATIONSHIPS & FRIENDSHIPS:
${socialSituation || "No specific social situation noted"}

SCHOOL SITUATION & ACADEMIC CONTEXT:
${schoolInfo || "No specific school information noted"}

CURRENT COPING STRATEGIES:
${copingStrategies || "No specific coping strategies identified yet"}

PREVIOUS THERAPY EXPERIENCE:
${previousTherapy || "No previous therapy experience noted"}

INTERESTS & HOBBIES:
${interests || "No specific interests noted yet"}

EMERGENCY CONTACTS:
${emergencyContacts || "No emergency contacts provided"}

PERSONALIZATION GUIDELINES FOR ${name}:

🎯 INTERESTS & STRENGTHS-BASED INTERVENTIONS:
- When ${name} mentions interests, hobbies, or activities they enjoy, incorporate these into therapeutic suggestions
- Use their interests as metaphors or examples in therapeutic conversations
- Reference their strengths and positive qualities when building confidence
- Create personalized coping strategies that align with their interests
- If ${name} has specific interests noted (${interests}), use these to create personalized therapeutic approaches
- Reference their hobbies, activities, pets, or favorite things when creating metaphors or examples

🎨 CREATIVE PERSONALIZATION EXAMPLES:
- If ${name} loves reading: "Since you love reading, maybe we can create a special bedtime story about your foxy protecting you"
- If ${name} enjoys art: "What if we drew a picture of that feeling and then changed it?"
- If ${name} likes sports: "How do you think your soccer team would handle this situation?"
- If ${name} has pets: "What would your dog say about this if they could talk?"
- If ${name} has siblings: "How do you think your brother would help you with this?"

🚨 FINAL REMINDER: EVERY response to ${name} must include their name. This is mandatory for therapeutic effectiveness.

🎯 PERSONALIZATION COMMAND: Always reference ${name}'s specific interests, family situation, recent changes, and background when creating therapeutic solutions. Make suggestions that are truly personalized to their unique circumstances.
`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

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
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select("id, family_id")
      .eq("id", childId)
      .eq("family_id", family.id)
      .eq("is_active", true)
      .single();

    if (error || !child) {
      return NextResponse.json(
        { error: "Child not found or access denied" },
        { status: 403 }
      );
    }

    // Get child context
    const childContext = await getChildContext(childId);

    return NextResponse.json({
      success: true,
      childContext,
    });
  } catch (error) {
    console.error("Error in child context API:", error);
    return NextResponse.json(
      { error: "Failed to get child context" },
      { status: 500 }
    );
  }
} 