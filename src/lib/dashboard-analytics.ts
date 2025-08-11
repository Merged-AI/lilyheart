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

// Calculate check-in streak for a child
async function calculateStreakData(childId: string, supabase: any) {
  try {
    // Get all sessions for this child, grouped by date
    const { data: sessions, error } = await supabase
      .from("therapy_sessions")
      .select("created_at")
      .eq("child_id", childId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!sessions || sessions.length === 0) {
      return {
        current_streak: 0,
        longest_streak: 0,
        last_check_in_date: null,
        streak_message: "Start your first session to begin your streak!",
      };
    }

    // Group sessions by date (remove time component)
    const sessionDates = new Set();
    sessions.forEach((session: any) => {
      const date = session.created_at.split("T")[0]; // Get YYYY-MM-DD part
      sessionDates.add(date);
    });

    // Convert to sorted array of dates (most recent first)
    const sortedDates = Array.from(sessionDates).sort().reverse();

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Check if there's activity today or yesterday to maintain streak
    if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
      let checkDate = new Date();
      for (let i = 0; i < sortedDates.length; i++) {
        const sessionDate = sortedDates[i];
        const expectedDate = checkDate.toISOString().split("T")[0];

        if (sessionDate === expectedDate) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (
          sessionDate ===
          new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        ) {
          // Allow for previous day if we haven't checked today yet
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 2);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = new Date(sortedDates[i] as string);
      const nextDate = new Date(sortedDates[i + 1] as string);
      const dayDifference =
        (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDifference === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Generate streak message
    let streakMessage = "";
    if (currentStreak === 0) {
      streakMessage = "Start a session today to begin your streak!";
    } else if (currentStreak >= 30) {
      streakMessage = "One month streak! Your consistency is incredible! 🏆";
    } else if (currentStreak >= 14) {
      streakMessage = "Two weeks strong! Amazing dedication! ⭐";
    } else if (currentStreak >= 7) {
      streakMessage = "7-day check-in streak! Keep going! 🔥";
    } else {
      streakMessage = `${currentStreak} day${
        currentStreak > 1 ? "s" : ""
      } - Keep building the habit!`;
    }

    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_check_in_date: sortedDates[0] || null,
      streak_message: streakMessage,
    };
  } catch (error) {
    console.error("Error calculating streak data:", error);
    return {
      current_streak: 0,
      longest_streak: 0,
      last_check_in_date: null,
      streak_message: "Unable to calculate streak",
    };
  }
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

    // If no sessions this week, clear analytics or create empty record
    if (!weeklySessionCount || weeklySessionCount === 0) {
      // Create/update analytics record with zero current week data but preserve basic info
      const { data: child } = await supabase
        .from("children")
        .select("name")
        .eq("id", childId)
        .single();

      const childName = child?.name || null;

      // Calculate streak data (this works regardless of current week sessions)
      const streakData = await calculateStreakData(childId, supabase);

      // Get total sessions count (historical)
      const { count: totalSessionCount, error: totalCountError } =
        await supabase
          .from("therapy_sessions")
          .select("*", { count: "exact", head: true })
          .eq("child_id", childId);

      if (totalCountError) throw totalCountError;

      // Get latest session for reference
      const { data: latestSessionData, error: latestSessionError } =
        await supabase
          .from("therapy_sessions")
          .select("*")
          .eq("child_id", childId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

      // Create empty analytics record for current week
      const emptyWeekAnalytics = {
        child_id: childId,
        family_id: familyId,
        child_name: childName,
        latest_mood: {
          status: "stable",
          trend: "stable",
          recorded_at: new Date().toISOString(),
        },
        sessions_analytics: {
          sessions_this_week: 0,
          total_sessions: totalSessionCount || 0,
          average_duration: 0,
          last_session_at: latestSessionData?.created_at || null,
          streak_analytics: streakData,
        },
        emotional_trend: {
          status: "stable",
          attention_needed: false,
          analysis_period: "no_current_data",
          key_factors: ["No sessions completed this week"],
        },
        active_concerns: {
          count: 0,
          level: "stable",
          identified_concerns: [],
          priority_concerns: [],
        },
        weekly_insight: {
          story: "hasn't had any therapy sessions this week yet",
          what_happened: "No sessions completed this week",
          good_news:
            "Previous sessions show engagement with the therapeutic process",
        },
        action_plan: {
          steps: [
            {
              timeframe: "Tonight",
              action: "Encourage your child to check in when they're ready",
              description:
                "Let them know the therapy chat is available whenever they want to talk",
            },
            {
              timeframe: "This Week",
              action: "Schedule regular check-in times",
              description: "Having consistent times can help build the habit",
            },
            {
              timeframe: "Next Week",
              action: "Review what works best for your child",
              description:
                "Some children prefer morning check-ins, others prefer evening",
            },
          ],
          quick_win:
            "Simply asking 'How are you feeling today?' can open up conversation",
        },
        progress_tracking: {
          wins: ["Maintains engagement with therapeutic support"],
          working_on: [
            {
              issue: "Regular check-in consistency",
              note: "Building a routine takes time",
            },
          ],
          when_to_worry:
            "If child avoids therapy conversations for more than two weeks consecutively",
        },
        alerts: {
          has_alert: false,
          alert_type: undefined,
          alert_title: undefined,
          alert_description: undefined,
          created_at: undefined,
        },
        communication_insights: [],
        growth_development_insights: [],
        family_communication_summary: {
          strengths: ["Provides therapeutic support structure"],
          growth_areas: ["Encourage regular check-ins"],
          recommendations: [
            "Consider gentle reminders about available support",
          ],
          updated_at: new Date().toISOString(),
        },
        conversation_organization: {
          key_topics: [],
          questions_to_consider: [
            "How can we make therapy sessions feel more accessible?",
            "What time of day works best for your child to check in?",
          ],
          updated_at: new Date().toISOString(),
        },
        family_wellness_tips: [
          {
            title: "Gentle Encouragement",
            description:
              "Sometimes children need time to process before sharing. Let them know you're available when they're ready.",
            updated_at: new Date().toISOString(),
          },
        ],
        family_communication_goals: [
          {
            goal_type: "This Week",
            description:
              "Create a welcoming environment for your child to share when ready",
            updated_at: new Date().toISOString(),
          },
          {
            goal_type: "Ongoing",
            description:
              "Maintain consistent availability for therapeutic conversations",
            updated_at: new Date().toISOString(),
          },
          {
            goal_type: "If Needed",
            description: "Gently encourage engagement if avoidance continues",
            updated_at: new Date().toISOString(),
          },
        ],
        updated_at: new Date().toISOString(),
      };

      // Upsert the empty analytics record
      const { data: upsertData, error: upsertError } = await supabase
        .from("dashboard_analytics")
        .upsert(emptyWeekAnalytics)
        .select()
        .single();

      if (upsertError) {
        console.error(
          `Debug: Error upserting empty analytics for child ${childId}:`,
          upsertError
        );
        throw upsertError;
      }
      return;
    }

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

    // Calculate streak data
    const streakData = await calculateStreakData(childId, supabase);

    // Calculate analytics from recent sessions using OpenAI
    const analytics = await calculateAnalytics(
      childId,
      recentSessions || [],
      latestSession
    );

    // Remove any fields that might cause conflicts
    const { id, created_at, ...analyticsData } = analytics as any;

    // Update the sessions_analytics with accurate counts and streak data
    const updatedAnalytics = {
      ...analyticsData,
      sessions_analytics: {
        ...analyticsData.sessions_analytics,
        sessions_this_week: weeklySessionCount || 0,
        total_sessions: totalSessionCount || 0,
        average_duration: Math.round(averageDuration),
        last_session_at: latestSession.created_at,
      },
      streak_analytics: streakData,
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

Create a compassionate, non-clinical analysis for PARENTS in this exact JSON format. Use natural, warm language that parents can easily understand. Avoid technical jargon, numerical scores, or clinical terminology in parent-facing content. Write as if speaking to a caring parent about their child's emotional growth:
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
    "wins": [
      "Write 2-3 meaningful wins this week in natural parent language. Focus on: emotional moments, social interactions, communication breakthroughs, coping strategies used, or personal growth. Avoid technical scores or clinical language. Examples: 'Shared excitement about a school project', 'Asked for help when feeling overwhelmed', 'Used breathing exercises during a difficult moment'"
    ],
    "working_on": [
      {
        "issue": "Area needing continued support (in simple parent terms)",
        "note": "What progress looks like and realistic expectations"
      }
    ],
    "when_to_worry": "Clear, specific indicators that would suggest parents should seek additional professional support"
  },
  "communication_insights": [{
    "topic": string,
    "confidence_score": number, // Must be between 0-100 representing percentage confidence - this is for internal analytics only, NOT shown to parents
    "observations": string[],
    "parent_insights": string[], // Write in natural parent language, no scores or numbers
    "communication_tips": string[], // Practical, actionable advice for parents
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
