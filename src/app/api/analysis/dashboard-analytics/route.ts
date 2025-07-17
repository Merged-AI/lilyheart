import { NextResponse } from "next/server";
import { calculateAndStoreDashboardAnalytics } from "@/lib/dashboard-analytics";
import { createServerSupabase } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const supabase = createServerSupabase(); // Use server-side client

  try {
    // Get childId from URL params
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "Child ID is required" },
        { status: 400 }
      );
    }

    // Fetch dashboard analytics for the child
    const { data: analytics, error } = await supabase
      .from("dashboard_analytics")
      .select("*")
      .eq("child_id", childId)
      .single();

    // Handle case where no analytics exist yet
    if (error?.code === "PGRST116") {
      return NextResponse.json(
        { message: "No analytics data available for this child yet" },
        { status: 400 }
      );
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: analytics });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard analytics" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createServerSupabase(); // Use server-side client

  try {
    const { childId: rawChildId } = await request.json();

    if (!rawChildId) {
      return NextResponse.json(
        { error: "Child ID is required" },
        { status: 400 }
      );
    }

    // Normalize the ID - trim whitespace and ensure correct case
    const childId = rawChildId.trim();

    // First try to get all matching children to see if there are any issues
    const { data: allMatches, error: matchError } = await supabase
      .from("children")
      .select("id, family_id")
      .eq("id", childId);

    // Then try the single query
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id, family_id")
      .eq("id", childId)
      .single();

    if (childError?.code === "PGRST116") {
      return NextResponse.json(
        {
          error: "Child not found",
          details: `No child found with ID: ${childId}`,
          code: "CHILD_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (childError) {
      console.error("Debug: Error fetching child:", childError);
      return NextResponse.json(
        {
          error: "Database error while fetching child",
          details: childError,
          code: "DATABASE_ERROR",
        },
        { status: 500 }
      );
    }

    if (!child?.family_id) {
      return NextResponse.json(
        { error: "Family ID not found for this child" },
        { status: 400 }
      );
    }

    // Fetch the latest session
    const { data: session, error: sessionError } = await supabase
      .from("therapy_sessions")
      .select("*")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sessionError) {
      console.error("Debug: Error fetching latest session:", sessionError);
      return NextResponse.json(
        {
          error: "Failed to fetch latest session",
          details: sessionError,
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { message: "No therapy sessions found for this child yet" },
        { status: 400 }
      );
    }

    // Trigger analytics recalculation with family_id
    try {
      await calculateAndStoreDashboardAnalytics(
        childId,
        session,
        child.family_id
      );
    } catch (calcError) {
      console.error(
        "Debug: Error in calculateAndStoreDashboardAnalytics:",
        calcError
      );
      return NextResponse.json(
        {
          error: "Failed to calculate analytics",
          details: calcError,
        },
        { status: 500 }
      );
    }

    // Add a small delay to allow for database consistency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fetch the updated analytics
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("dashboard_analytics")
      .select("*")
      .eq("child_id", childId)
      .maybeSingle();

    if (analyticsError) {
      console.error("Debug: Error fetching updated analytics:", analyticsError);
      return NextResponse.json(
        {
          error: "Failed to fetch updated analytics",
          details: analyticsError,
          message:
            "Analytics calculation was triggered but verification failed",
        },
        { status: 202 }
      );
    }

    // Return the analytics record if it exists, or a success message if not
    return NextResponse.json({
      data: analyticsData || { message: "Analytics calculation triggered" },
      status: analyticsData ? "completed" : "processing",
    });
  } catch (error) {
    console.error("Debug: Top-level error:", error);
    return NextResponse.json(
      {
        error: "Failed to update dashboard analytics",
        details: error,
        message: "An error occurred while calculating or storing analytics",
      },
      { status: 500 }
    );
  }
}
