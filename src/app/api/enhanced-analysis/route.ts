import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";
import { enhancedChatAnalyzer } from "@/lib/enhanced-chat-analysis";

// Simple in-memory cache for enhanced analysis (clears every 10 minutes)
const analysisCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function getCachedAnalysis(childId: string, timeframeDays: number): any | null {
  const cacheKey = `${childId}_${timeframeDays}`;
  const cached = analysisCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.analysis;
  }

  return null;
}

function setCachedAnalysis(
  childId: string,
  timeframeDays: number,
  analysis: any
): void {
  const cacheKey = `${childId}_${timeframeDays}`;
  analysisCache.set(cacheKey, {
    analysis,
    timestamp: Date.now(),
  });

  // Clean up old entries
  if (analysisCache.size > 50) {
    const now = Date.now();
    const entries = Array.from(analysisCache.entries());
    for (const [key, value] of entries) {
      if (now - value.timestamp > CACHE_DURATION) {
        analysisCache.delete(key);
      }
    }
  }
}

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

    // Check cache for existing analysis
    const cachedAnalysis = getCachedAnalysis(targetChildId, timeframeDays);
    if (cachedAnalysis) {
      return NextResponse.json({
        success: true,
        childId: targetChildId,
        childInfo: null, // No need to refetch child info if cached
        analysis: cachedAnalysis,
        sessionData: null, // No need to refetch session data if cached
        metadata: {
          generatedAt: new Date().toISOString(),
          timeframe: `${timeframeDays} days`,
          totalSessions: cachedAnalysis.totalSessions,
          patternsAnalyzed: cachedAnalysis.communicationPatterns.length,
          dailyInsights: cachedAnalysis.dailyInsights,
        },
      });
    }

    // Generate enhanced analysis
    const analysis = await enhancedChatAnalyzer.generateComprehensiveAnalysis(
      targetChildId,
      timeframeDays
    );

    // Cache the analysis
    setCachedAnalysis(targetChildId, timeframeDays, analysis);

    // Get child details for additional context
    const supabase = createServerSupabase();
    const { data: child } = await supabase
      .from("children")
      .select("name, age, current_concerns, parent_goals")
      .eq("id", targetChildId)
      .single();

    // Get session data for additional insights (limit to essential fields)
    const { data: sessions } = await supabase
      .from("therapy_sessions")
      .select(
        "id, created_at, session_duration, topics, has_alert, alert_level, mood_analysis"
      )
      .eq("child_id", targetChildId)
      .gte(
        "created_at",
        new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("created_at", { ascending: true })
      .limit(1000); // Limit to prevent excessive data processing

    // Group sessions by date for better insights (optimized)
    const groupedSessions = groupSessionsByDate(sessions || []);

    // Generate daily insights (cached with analysis)
    const dailyInsights = generateDailyInsights(groupedSessions);

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
        dailyInsights,
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

// Group sessions by date for better analysis (optimized)
function groupSessionsByDate(sessions: any[]): any[] {
  if (sessions.length === 0) return [];

  const grouped: any[] = [];
  const sessionMap = new Map<string, any[]>();

  // Single pass to group sessions
  for (const session of sessions) {
    const date = session.created_at.split("T")[0];
    if (!sessionMap.has(date)) {
      sessionMap.set(date, []);
    }
    sessionMap.get(date)!.push(session);
  }

  // Process each day's sessions
  const entries = Array.from(sessionMap.entries());
  for (const [date, daySessions] of entries) {
    // Calculate daily metrics efficiently
    let totalDuration = 0;
    let validMoodSessions = 0;
    let totalHappiness = 0;
    let totalAnxiety = 0;
    let totalSadness = 0;
    let totalStress = 0;
    let totalConfidence = 0;
    const topicsSet = new Set<string>();
    let hasAlert = false;
    let alertLevel: string | null = null;

    for (const session of daySessions) {
      totalDuration += session.session_duration || 0;

      if (
        session.mood_analysis &&
        typeof session.mood_analysis.happiness === "number"
      ) {
        validMoodSessions++;
        totalHappiness += session.mood_analysis.happiness;
        totalAnxiety += session.mood_analysis.anxiety || 0;
        totalSadness += session.mood_analysis.sadness || 0;
        totalStress += session.mood_analysis.stress || 0;
        totalConfidence += session.mood_analysis.confidence || 0;
      }

      if (session.topics) {
        for (const topic of session.topics) {
          topicsSet.add(topic);
        }
      }

      if (session.has_alert) {
        hasAlert = true;
        if (session.alert_level === "high") {
          alertLevel = "high";
        } else if (!alertLevel && session.alert_level === "medium") {
          alertLevel = "medium";
        }
      }
    }

    const averageMood =
      validMoodSessions > 0
        ? {
            happiness: Math.round(totalHappiness / validMoodSessions),
            anxiety: Math.round(totalAnxiety / validMoodSessions),
            sadness: Math.round(totalSadness / validMoodSessions),
            stress: Math.round(totalStress / validMoodSessions),
            confidence: Math.round(totalConfidence / validMoodSessions),
            insights: `Average mood from ${validMoodSessions} sessions`,
          }
        : null;

    grouped.push({
      date,
      sessionCount: daySessions.length,
      totalDuration,
      averageMood,
      topics: Array.from(topicsSet),
      hasAlert,
      alertLevel,
      sessions: daySessions.map((session: any) => ({
        id: session.id,
        date: session.created_at.split("T")[0],
        session_duration: session.session_duration,
        topics: session.topics,
        has_alert: session.has_alert,
        alert_level: session.alert_level,
        mood_analysis: session.mood_analysis,
      })),
    });
  }

  return grouped.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// Generate daily insights from grouped sessions (optimized)
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

  // Calculate session frequency efficiently
  let totalSessions = 0;
  for (const day of groupedSessions) {
    totalSessions += day.sessionCount;
  }
  const avgSessionsPerDay = totalSessions / groupedSessions.length;

  if (avgSessionsPerDay > 2) {
    trends.push("High engagement: Child is having multiple sessions per day");
  } else if (avgSessionsPerDay > 1) {
    trends.push("Good engagement: Child is having regular daily sessions");
  } else {
    trends.push("Moderate engagement: Child is having occasional sessions");
  }

  // Analyze mood trends efficiently
  let totalHappiness = 0;
  let totalAnxiety = 0;
  let moodDaysCount = 0;

  for (const day of groupedSessions) {
    if (day.averageMood) {
      totalHappiness += day.averageMood.happiness;
      totalAnxiety += day.averageMood.anxiety;
      moodDaysCount++;
    }
  }

  if (moodDaysCount > 0) {
    const avgHappiness = totalHappiness / moodDaysCount;
    const avgAnxiety = totalAnxiety / moodDaysCount;

    if (avgHappiness > 7) {
      trends.push(
        "Positive emotional state: Child shows high happiness levels"
      );
    }
    if (avgAnxiety > 6) {
      trends.push("Elevated anxiety: Child may need additional support");
    }
  }

  // Analyze alert patterns efficiently
  let alertDaysCount = 0;
  for (const day of groupedSessions) {
    if (day.hasAlert) {
      alertDaysCount++;
    }
  }

  if (alertDaysCount > 0) {
    patterns.push(
      `Alert days: ${alertDaysCount} days with concerning indicators`
    );
  }

  // Analyze topic patterns efficiently
  const topicFrequency: { [key: string]: number } = {};
  for (const day of groupedSessions) {
    for (const topic of day.topics) {
      topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
    }
  }

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
    summary: `Analyzed ${groupedSessions.length} days of session data with ${totalSessions} total sessions`,
  };
}
