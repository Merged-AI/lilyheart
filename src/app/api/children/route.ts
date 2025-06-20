import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";

// GET: Fetch all children for the authenticated family
export async function GET(request: NextRequest) {
  const family = await getAuthenticatedFamilyFromToken();

  if (!family) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const supabase = createServerSupabase();
  const { data: children, error } = await supabase
    .from("children")
    .select("*")
    .eq("family_id", family.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }

  return NextResponse.json({ children: children || [] });
}

// POST: Add a new child to the family or update existing child
export async function POST(request: NextRequest) {
  const family = await getAuthenticatedFamilyFromToken();

  if (!family) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const childData = await request.json();
    const { childId, ...childInfo } = childData;

    const supabase = createServerSupabase();

    let result;
    if (childId) {
      // Update existing child
      const { data, error } = await supabase
        .from("children")
        .update({
          name: childInfo.name,
          age: childInfo.age,
          gender: childInfo.gender,
          background: childInfo.background,
          current_concerns: childInfo.currentConcerns,
          triggers: childInfo.triggers,
          coping_strategies: childInfo.copingStrategies,
          previous_therapy: childInfo.previousTherapy,
          school_info: childInfo.schoolInfo,
          family_dynamics: childInfo.familyDynamics,
          social_situation: childInfo.socialSituation,
          reason_for_adding: childInfo.reasonForAdding,
          parent_goals: childInfo.parentGoals,
          emergency_contacts: childInfo.emergencyContacts,
          profile_completed: true,
        })
        .eq("id", childId)
        .eq("family_id", family.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new child
      const { data, error } = await supabase
        .from("children")
        .insert({
          family_id: family.id,
          name: childInfo.name,
          age: childInfo.age,
          gender: childInfo.gender,
          background: childInfo.background,
          current_concerns: childInfo.currentConcerns,
          triggers: childInfo.triggers,
          coping_strategies: childInfo.copingStrategies,
          previous_therapy: childInfo.previousTherapy,
          school_info: childInfo.schoolInfo,
          family_dynamics: childInfo.familyDynamics,
          social_situation: childInfo.socialSituation,
          reason_for_adding: childInfo.reasonForAdding,
          parent_goals: childInfo.parentGoals,
          emergency_contacts: childInfo.emergencyContacts,
          is_active: true,
          profile_completed: true,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      child: result,
      message: childId
        ? "Child updated successfully"
        : "Child added successfully",
    });
  } catch (error) {
    console.error("Error saving child:", error);
    return NextResponse.json(
      { error: "Failed to save child" },
      { status: 500 }
    );
  }
}
