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

    // Get session data for additional insights
    const { data: sessions } = await supabase
      .from("therapy_sessions")
      .select("*")
      .eq("child_id", targetChildId)
      .gte(
        "created_at",
        new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("created_at", { ascending: true });

    // Group sessions by date for better insights
    const groupedSessions = groupSessionsByDate(sessions || []);

    return NextResponse.json({
      success: true,
      childId: targetChildId,
      childInfo: child,
      analysis,
      sessionData: {
        totalSessions: sessions?.length || 0,
        totalDays: groupedSessions.length,
        averageSessionsPerDay:
          groupedSessions.length > 0
            ? (sessions?.length || 0) / groupedSessions.length
            : 0,
        groupedSessions,
        dateRange:
          groupedSessions.length > 0
            ? {
                start: groupedSessions[0].date,
                end: groupedSessions[groupedSessions.length - 1].date,
              }
            : null,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        timeframe: `${timeframeDays} days`,
        totalSessions: analysis.totalSessions,
        patternsAnalyzed: analysis.communicationPatterns.length,
        dailyInsights: generateDailyInsights(groupedSessions),
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

// Group sessions by date for better analysis
function groupSessionsByDate(sessions: any[]): any[] {
  const grouped: any[] = [];
  const sessionMap = new Map<string, any[]>();

  sessions.forEach((session) => {
    const date = session.created_at.split("T")[0];
    if (!sessionMap.has(date)) {
      sessionMap.set(date, []);
    }
    sessionMap.get(date)?.push(session);
  });

  sessionMap.forEach((daySessions, date) => {
    // Calculate daily metrics
    const totalDuration = daySessions.reduce(
      (sum, session) => sum + (session.session_duration || 0),
      0
    );
    const avgMood = calculateAverageMood(daySessions);
    const allTopics = Array.from(
      new Set(daySessions.flatMap((session) => session.topics || []))
    );
    const hasAlert = daySessions.some((session) => session.has_alert);
    const alertLevel =
      daySessions.find((session) => session.alert_level === "high")
        ?.alert_level ||
      daySessions.find((session) => session.alert_level === "medium")
        ?.alert_level ||
      null;

    grouped.push({
      date,
      sessionCount: daySessions.length,
      totalDuration,
      averageMood: avgMood,
      topics: allTopics,
      hasAlert,
      alertLevel,
      sessions: daySessions.map((session: any) => ({
        ...session,
        date: session.created_at.split("T")[0],
      })),
    });
  });

  return grouped.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// Calculate average mood from multiple sessions
function calculateAverageMood(sessions: any[]): any {
  const validMoods = sessions.filter(
    (session) =>
      session.mood_analysis &&
      typeof session.mood_analysis.happiness === "number"
  );

  if (validMoods.length === 0) return null;

  const totalHappiness = validMoods.reduce(
    (sum, session) => sum + session.mood_analysis.happiness,
    0
  );
  const totalAnxiety = validMoods.reduce(
    (sum, session) => sum + (session.mood_analysis.anxiety || 0),
    0
  );
  const totalSadness = validMoods.reduce(
    (sum, session) => sum + (session.mood_analysis.sadness || 0),
    0
  );
  const totalStress = validMoods.reduce(
    (sum, session) => sum + (session.mood_analysis.stress || 0),
    0
  );
  const totalConfidence = validMoods.reduce(
    (sum, session) => sum + (session.mood_analysis.confidence || 0),
    0
  );

  return {
    happiness: Math.round(totalHappiness / validMoods.length),
    anxiety: Math.round(totalAnxiety / validMoods.length),
    sadness: Math.round(totalSadness / validMoods.length),
    stress: Math.round(totalStress / validMoods.length),
    confidence: Math.round(totalConfidence / validMoods.length),
    insights: `Average mood from ${validMoods.length} sessions`,
  };
}

// Generate daily insights from grouped sessions
function generateDailyInsights(groupedSessions: any[]): any {
  if (groupedSessions.length === 0) {
    return {
      message: "No session data available for insights",
      trends: [],
      patterns: [],
    };
  }

  const trends = [];
  const patterns = [];

  // Analyze session frequency trends
  const sessionCounts = groupedSessions.map((day) => day.sessionCount);
  const avgSessionsPerDay =
    sessionCounts.reduce((sum, count) => sum + count, 0) / sessionCounts.length;

  if (avgSessionsPerDay > 2) {
    trends.push("High engagement: Child is having multiple sessions per day");
  } else if (avgSessionsPerDay > 1) {
    trends.push("Good engagement: Child is having regular daily sessions");
  } else {
    trends.push("Moderate engagement: Child is having occasional sessions");
  }

  // Analyze mood trends
  const moodDays = groupedSessions.filter((day) => day.averageMood);
  if (moodDays.length > 0) {
    const avgHappiness =
      moodDays.reduce((sum, day) => sum + day.averageMood.happiness, 0) /
      moodDays.length;
    const avgAnxiety =
      moodDays.reduce((sum, day) => sum + day.averageMood.anxiety, 0) /
      moodDays.length;

    if (avgHappiness > 7) {
      trends.push(
        "Positive emotional state: Child shows high happiness levels"
      );
    }
    if (avgAnxiety > 6) {
      trends.push("Elevated anxiety: Child may need additional support");
    }
  }

  // Analyze alert patterns
  const alertDays = groupedSessions.filter((day) => day.hasAlert);
  if (alertDays.length > 0) {
    patterns.push(
      `Alert days: ${alertDays.length} days with concerning indicators`
    );
  }

  // Analyze topic patterns
  const allTopics = groupedSessions.flatMap((day) => day.topics);
  const topicFrequency: { [key: string]: number } = {};
  allTopics.forEach((topic) => {
    topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
  });

  const frequentTopics = Object.entries(topicFrequency)
    .filter(([_, count]) => (count as number) > 1)
    .sort(([_, a], [__, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([topic, count]) => `${topic} (${count} times)`);

  if (frequentTopics.length > 0) {
    patterns.push(`Frequent topics: ${frequentTopics.join(", ")}`);
  }

  return {
    totalDays: groupedSessions.length,
    averageSessionsPerDay: avgSessionsPerDay,
    trends,
    patterns,
    summary: `Analyzed ${
      groupedSessions.length
    } days of session data with ${groupedSessions.reduce(
      (sum, day) => sum + day.sessionCount,
      0
    )} total sessions`,
  };
}
