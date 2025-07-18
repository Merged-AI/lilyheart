import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    const { childId, sessionDuration } = await request.json();

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

    const supabase = createServerSupabase();

    // First verify that this child belongs to the family
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .eq("family_id", family.id)
      .single();

    if (childError || !child) {
      return NextResponse.json(
        { error: "Child not found or access denied" },
        { status: 403 }
      );
    }

    // Mark any active sessions for this child as completed
    const { error: updateError } = await supabase
      .from("therapy_sessions")
      .update({
        status: "completed",
        created_at: new Date().toISOString(),
        session_duration: sessionDuration,
      })
      .eq("child_id", childId)
      .eq("status", "active");

    if (updateError) {
      console.error("Error completing sessions:", updateError);
      return NextResponse.json(
        { error: "Failed to complete sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in complete session API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
