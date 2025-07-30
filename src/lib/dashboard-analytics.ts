import { TherapySession, DashboardAnalytics } from "@/types/database";
import { createServerSupabase } from "@/lib/supabase-auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AnalyticsCalculationResult = Omit<DashboardAnalytics, "id" | "created_at">;

// Utility function to get the start of the current week (Sunday) - matches route.ts logic
function getStartOfWeek(date: Date = new Date()): Date {
  const startOfWeek = new Date(date);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return startOfWeek;
}

export async function calculateAndStoreDashboardAnalytics(
  childId: string,
  latestSession: TherapySession,
  familyId: string
): Promise<void> {
  const supabase = createServerSupabase();

  try {
    // Get current date and start of week using consistent logic
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);

    // Fetch sessions count for this week
    const { count: weeklySessionCount, error: weeklyCountError } =
      await supabase
        .from("therapy_sessions")
        .select("*", { count: "exact", head: true })
        .eq("child_id", childId)
        .gte("created_at", startOfWeek.toISOString());

    if (weeklyCountError) throw weeklyCountError;

    // Fetch last 10 sessions for trend analysis
    const { data: recentSessions, error: sessionsError } = await supabase
      .from("therapy_sessions")
      .select("*")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (sessionsError) throw sessionsError;

    // Get total sessions count
    const { count: totalSessionCount, error: totalCountError } = await supabase
      .from("therapy_sessions")
      .select("*", { count: "exact", head: true })
      .eq("child_id", childId);

    if (totalCountError) throw totalCountError;

    // Calculate average duration from recent sessions
    const averageDuration =
      recentSessions?.reduce((acc, s) => acc + (s.session_duration || 0), 0) /
      (recentSessions?.length || 1);

    // Calculate analytics from recent sessions using OpenAI
    const analytics = await calculateAnalytics(
      childId,
      recentSessions || [],
      latestSession
    );

    // Remove any fields that might cause conflicts
    const { id, created_at, ...analyticsData } = analytics as any;

    // Update the sessions_analytics with accurate counts
    const updatedAnalytics = {
      ...analyticsData,
      sessions_analytics: {
        ...analyticsData.sessions_analytics,
        sessions_this_week: weeklySessionCount || 0,
        total_sessions: totalSessionCount || 0,
        average_duration: Math.round(averageDuration),
        last_session_at: latestSession.created_at,
      },
    };

    const { data: upsertData, error: upsertError } = await supabase
      .from("dashboard_analytics")
      .upsert({
        ...updatedAnalytics,
        child_id: childId,
        family_id: familyId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertError) throw upsertError;
  } catch (error) {
    console.error(
      "Debug: Error in calculateAndStoreDashboardAnalytics:",
      error
    );
    throw error;
  }
}

async function calculateAnalytics(
  childId: string,
  sessions: TherapySession[],
  latestSession: TherapySession
): Promise<AnalyticsCalculationResult> {
  const now = new Date();
  // Use consistent week calculation logic
  const startOfWeek = getStartOfWeek(now);
  
  // Get supabase client to fetch child name
  const supabase = createServerSupabase();
  
  // Fetch child name
  const { data: child } = await supabase
    .from("children")
    .select("name")
    .eq("id", childId)
    .single();
  
  const childName = child?.name || null;

  // Basic session statistics using the consistent week logic
  const sessionsThisWeek = sessions.filter(
    (s) => new Date(s.created_at) >= startOfWeek
  ).length;

  const totalSessions = sessions.length;
  const averageDuration =
    sessions.reduce((acc, s) => acc + (s.session_duration || 0), 0) /
    totalSessions;

  // Prepare session data for OpenAI analysis
  const sessionData = sessions.map((s) => ({
    date: s.created_at,
    duration: s.session_duration,
    mood_analysis: s.mood_analysis,
    topics: s.topics,
    messages: s.messages,
  }));

  // Get AI analysis for emotional trends and insights
  const aiAnalysisPrompt = `Analyze these therapy sessions (up to last 10 sessions) for a child and provide comprehensive insights focusing on recent trends and patterns. Focus on emotional trends, communication patterns, and therapeutic progress. Sessions data:
${JSON.stringify(sessionData, null, 2)}

Create a compassionate, non-clinical analysis in this exact JSON format, ensuring confidence_score is a percentage between 0-100:
{
  "emotional_trend": {
    "status": "improving" | "declining" | "stable",
    "attention_needed": boolean,
    "analysis_period": "last_10_sessions",
    "key_factors": string[]
  },
  "active_concerns": {
    "count": number,
    "level": "stable" | "monitoring" | "high_priority",
    "identified_concerns": string[],
    "priority_concerns": string[]
  },
  "weekly_insight": {
    "story": "is working through [describe the developmental challenge in warm, normal terms]",
    "what_happened": "Brief summary of what the child shared or experienced this week",
    "good_news": "Positive emotional growth or communication progress observed"
  },
  "action_plan": {
    "steps": [
      {
        "timeframe": "Tonight",
        "action": "Specific immediate action for parents",
        "description": "Brief explanation of how to do it"
      },
      {
        "timeframe": "This Week", 
        "action": "Ongoing weekly action",
        "description": "How to implement throughout the week"
      },
      {
        "timeframe": "Next Week",
        "action": "Future step if needed",
        "description": "When and how to take this step"
      }
    ],
    "quick_win": "One simple thing parents can do right now for immediate positive impact"
  },
  "progress_tracking": {
    "wins": ["Positive developments or breakthroughs"],
    "working_on": [
      {
        "issue": "Area of focus",
        "note": "Context about progress"
      }
    ],
    "when_to_worry": "Clear indicator for when to seek additional support"
  },
  "communication_insights": [{
    "topic": string,
    "confidence_score": number, // Must be between 0-100 representing percentage confidence
    "observations": string[],
    "parent_insights": string[],
    "communication_tips": string[],
    "recommended_next_step": string,
    "updated_at": "${new Date().toISOString()}"
  }],
  "growth_development_insights": [{
    "category": string,
    "insight_summary": string,
    "insight_detail": string,
    "suggested_actions": string[],
    "updated_at": "${new Date().toISOString()}"
  }],
  "family_communication_summary": {
    "strengths": string[],
    "growth_areas": string[],
    "recommendations": string[],
    "updated_at": "${new Date().toISOString()}"
  },
  "conversation_organization": {
    "key_topics": string[],
    "questions_to_consider": string[],
    "updated_at": "${new Date().toISOString()}"
  },
  "family_wellness_tips": [{
    "title": string,
    "description": string,
    "updated_at": "${new Date().toISOString()}"
  }],
  "family_communication_goals": [ // Must include exactly these three goals in this order
    {
      "goal_type": "This Week", // Short-term immediate action
      "description": string,
      "updated_at": "${new Date().toISOString()}"
    },
    {
      "goal_type": "Ongoing", // Medium-term consistent practice
      "description": string,
      "updated_at": "${new Date().toISOString()}"
    },
    {
      "goal_type": "If Needed", // Contingency plan
      "description": string,
      "updated_at": "${new Date().toISOString()}"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    messages: [
      {
        role: "system",
        content:
          "You are an expert child psychologist analyzing therapy session data to provide insights for parents and therapists.",
      },
      { role: "user", content: aiAnalysisPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const aiAnalysis = JSON.parse(
    completion.choices[0]?.message?.content || "{}"
  );

  // Calculate latest mood from the most recent session
  const moodAnalysis = latestSession.mood_analysis || {
    happiness: 5,
    anxiety: 5,
    sadness: 5,
    stress: 5,
    confidence: 5,
  };

  const latestMood = {
    status:
      moodAnalysis.happiness > 7
        ? "Happy"
        : moodAnalysis.anxiety > 7
        ? "Anxious"
        : moodAnalysis.sadness > 7
        ? "Sad"
        : moodAnalysis.stress > 7
        ? "Stressed"
        : moodAnalysis.confidence > 7
        ? "Confident"
        : "Stable",
    trend:
      moodAnalysis.happiness > 7
        ? "Improving"
        : moodAnalysis.anxiety > 7 ||
          moodAnalysis.sadness > 7 ||
          moodAnalysis.stress > 7
        ? "Needs attention"
        : "Stable",
    recorded_at: latestSession.created_at,
  };

  // Determine if alerts are needed based on AI analysis
  const hasAlert = aiAnalysis.active_concerns.level === "high_priority";

  return {
    child_id: childId,
    child_name: childName,
    latest_mood: latestMood,
    sessions_analytics: {
      sessions_this_week: sessionsThisWeek,
      total_sessions: totalSessions,
      average_duration: Math.round(averageDuration),
      last_session_at: latestSession.created_at,
    },
    emotional_trend: aiAnalysis.emotional_trend,
    active_concerns: aiAnalysis.active_concerns,
    weekly_insight: aiAnalysis.weekly_insight || null,
    action_plan: aiAnalysis.action_plan || null,
    progress_tracking: aiAnalysis.progress_tracking || null,
    alerts: {
      has_alert: hasAlert,
      alert_type: hasAlert ? "warning" : undefined,
      alert_title: hasAlert ? "High Priority Concerns Detected" : undefined,
      alert_description: hasAlert
        ? "Multiple concerns requiring immediate attention identified."
        : undefined,
      created_at: hasAlert ? now.toISOString() : undefined,
    },
    communication_insights: aiAnalysis.communication_insights || [],
    growth_development_insights: aiAnalysis.growth_development_insights || [],
    family_communication_summary: aiAnalysis.family_communication_summary || {
      strengths: [],
      growth_areas: [],
      recommendations: [],
      updated_at: now.toISOString(),
    },
    conversation_organization: aiAnalysis.conversation_organization || {
      key_topics: [],
      questions_to_consider: [],
      updated_at: now.toISOString(),
    },
    family_wellness_tips: aiAnalysis.family_wellness_tips || [],
    family_communication_goals: aiAnalysis.family_communication_goals || [],
    updated_at: new Date().toISOString(),
  };
}

// Export for testing purposes
export const __test__ = {
  calculateAnalytics,
};
