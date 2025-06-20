import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";
import { enhancedChatAnalyzer } from "@/lib/enhanced-chat-analysis";

// Validate child belongs to authenticated family
async function validateChildAccess(
  familyId: string,
  childId: string
): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .eq("family_id", familyId)
      .single();

    return !error && child !== null;
  } catch (error) {
    return false;
  }
}

// Get the most recent active child from the authenticated family
async function getMostRecentChild(familyId: string): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select("id")
      .eq("family_id", familyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !child) {
      return null;
    }

    return child.id;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated family
    const family = await getAuthenticatedFamilyFromToken();
    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeframeDays = parseInt(searchParams.get("days") || "30");
    const requestedChildId = searchParams.get("childId");

    // Determine which child to analyze
    let targetChildId = requestedChildId;
    if (!targetChildId) {
      targetChildId = await getMostRecentChild(family.id);
    }

    if (!targetChildId) {
      return NextResponse.json(
        {
          error: "No active children found. Please register a child first.",
          requiresChildRegistration: true,
        },
        { status: 404 }
      );
    }

    // Validate child access
    const hasAccess = await validateChildAccess(family.id, targetChildId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this child" },
        { status: 403 }
      );
    }

    // Generate enhanced analysis
    const analysis = await enhancedChatAnalyzer.generateComprehensiveAnalysis(
      targetChildId,
      timeframeDays
    );

    // Get child details for additional context
    const supabase = createServerSupabase();
    const { data: child } = await supabase
      .from("children")
      .select("name, age, current_concerns, parent_goals")
      .eq("id", targetChildId)
      .single();

    return NextResponse.json({
      success: true,
      childId: targetChildId,
      childInfo: child,
      analysis,
      metadata: {
        generatedAt: new Date().toISOString(),
        timeframe: `${timeframeDays} days`,
        totalSessions: analysis.totalSessions,
        patternsAnalyzed: analysis.communicationPatterns.length,
      },
    });
  } catch (error) {
    console.error("Error in enhanced analysis API:", error);
    return NextResponse.json(
      {
        error: "Internal server error during enhanced analysis",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
