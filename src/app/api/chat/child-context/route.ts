import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedFamilyFromToken, createServerSupabase } from "@/lib/supabase-auth";

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

  return `Name: ${name}, Age: ${age} years old. Current concerns: ${currentConcerns}. Parent goals: ${parentGoals}. Known triggers: ${triggers || "None identified"}. Reason for therapy: ${reasonForAdding}. Use age-appropriate language for a ${age}-year-old. Always use the child's name (${name}) when appropriate and reference their specific concerns.`;
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