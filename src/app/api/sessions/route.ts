import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Message = {
  sender: "child" | "ai";
  content: string;
  timestamp: string;
};

interface SessionData {
  userMessage: {
    content: string;
    mood?: {
      happiness: number;
      anxiety: number;
      sadness: number;
      stress: number;
      confidence: number;
    };
  };
  aiMessage: {
    content: string;
  };
  sessionDuration: number;
}

// Analyze mood using OpenAI for accurate emotional assessment
async function analyzeMoodFromMessage(
  userMessage: string,
  aiResponse: string
): Promise<any> {
  try {
    const prompt = `Analyze the emotional state of a child based on their message. Provide a detailed mood analysis with scores from 1-10 for each dimension.

Child's message: "${userMessage}"

Please analyze the emotional content and provide scores for:
- happiness (1=very sad, 10=very happy)
- anxiety (1=very calm, 10=very anxious)
- sadness (1=not sad at all, 10=extremely sad)
- stress (1=very relaxed, 10=extremely stressed)
- confidence (1=very low confidence, 10=very confident)

IMPORTANT: Pay special attention to concerning content like:
- Thoughts of harm to self or others
- Suicidal ideation
- Extreme emotional distress
- Violent thoughts
- Hopelessness

For concerning content, use appropriate high scores for anxiety, sadness, and stress.

Respond with a JSON object only:
{
  "happiness": number,
  "anxiety": number,
  "sadness": number,
  "stress": number,
  "confidence": number,
  "insights": "Brief caring observation about the emotional state"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a child psychologist specializing in emotional assessment. Provide accurate, nuanced mood analysis based on the child's message content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const moodAnalysis = JSON.parse(response);

    // Ensure all scores are within 1-10 range
    moodAnalysis.happiness = Math.max(
      1,
      Math.min(10, moodAnalysis.happiness || 5)
    );
    moodAnalysis.anxiety = Math.max(1, Math.min(10, moodAnalysis.anxiety || 5));
    moodAnalysis.sadness = Math.max(1, Math.min(10, moodAnalysis.sadness || 5));
    moodAnalysis.stress = Math.max(1, Math.min(10, moodAnalysis.stress || 5));
    moodAnalysis.confidence = Math.max(
      1,
      Math.min(10, moodAnalysis.confidence || 5)
    );

    return moodAnalysis;
  } catch (error) {
    console.error("Error analyzing mood with OpenAI:", error);

    // Return default neutral scores if OpenAI analysis fails
    return {
      happiness: 5,
      anxiety: 5,
      sadness: 5,
      stress: 5,
      confidence: 5,
      insights: "Unable to analyze mood - using neutral baseline scores",
    };
  }
}

// Extract topics from a message using OpenAI for intelligent categorization
async function extractTopicsFromMessage(message: string): Promise<string[]> {
  if (!message) return ["General conversation"];

  try {
    const prompt = `Analyze this child's message and identify the main topics/themes being discussed. 

Child's message: "${message}"

Please identify 1-3 most relevant topics from these categories:
- School stress (academic pressure, homework, tests, teachers)
- Social relationships (friends, peers, social interactions)
- Anxiety (worries, fears, nervousness)
- Family dynamics (parents, siblings, family relationships)
- Sleep issues (sleep problems, tiredness, nightmares)
- Stress management (feeling overwhelmed, pressure)
- Anger management (frustration, anger, irritation)
- Bullying concerns (being picked on, mean behavior)
- Coping strategies (relaxation, calming techniques)
- Positive emotions (happiness, joy, excitement)
- Sadness (feeling down, depressed, lonely)
- Self-esteem (confidence, achievements, self-worth)
- Hobbies and interests (activities, games, creative pursuits)
- Daily activities (routine, daily events, schedule)
- Physical health (illness, pain, body concerns)

Respond with a JSON array of topic names only, no explanations:
["topic1", "topic2"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a child psychology expert who can quickly identify the main themes and topics in children's messages. Provide accurate topic categorization.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const topics = JSON.parse(response);

    // Ensure it's an array and has valid topics
    if (Array.isArray(topics) && topics.length > 0) {
      return topics;
    }

    return ["General conversation"];
  } catch (error) {
    console.error("Error extracting topics with OpenAI:", error);

    // Fallback to basic keyword detection for critical cases
    const lowerMessage = message.toLowerCase();

    // Simple fallback checks for concerning content
    if (
      lowerMessage.includes("suicide") ||
      lowerMessage.includes("kill") ||
      lowerMessage.includes("die")
    ) {
      return ["Crisis intervention"];
    }
    if (lowerMessage.includes("bully") || lowerMessage.includes("hurt me")) {
      return ["Bullying concerns"];
    }
    if (lowerMessage.includes("anxious") || lowerMessage.includes("worried")) {
      return ["Anxiety"];
    }

    return ["General conversation"];
  }
}

// Analyze message for critical content using OpenAI
async function analyzeCriticalContent(
  message: string
): Promise<{ isCritical: boolean; reason?: string }> {
  try {
    const prompt = `As a child safety expert, analyze this message from a child for any concerning or critical content that requires immediate attention. This includes but is not limited to:

- Suicidal thoughts or self-harm intentions
- Abuse (physical, emotional, sexual)
- Violence or threats
- Severe emotional distress
- Dangerous situations
- Serious mental health concerns
- Neglect or abandonment
- Bullying (severe cases)
- Expressions of hopelessness
- Eating disorders
- Substance abuse
- Any other serious concerns requiring immediate intervention

Child's message: "${message}"

Respond with a JSON object only:
{
  "isCritical": boolean,
  "reason": "Brief explanation if critical content detected, otherwise null",
  "confidenceScore": number (0-1)
}

Be especially vigilant for subtle indicators of serious issues. Err on the side of caution.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert child psychologist specializing in crisis detection and intervention. Your task is to identify potentially critical or concerning content in children's messages that requires immediate attention.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.1, // Low temperature for more consistent, conservative analysis
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    const analysis = JSON.parse(response);

    // If confidence is high enough and content is flagged as critical
    if (analysis.confidenceScore >= 0.7 && analysis.isCritical) {
      return {
        isCritical: true,
        reason: analysis.reason,
      };
    }

    return {
      isCritical: false,
    };
  } catch (error) {
    console.error("Error analyzing critical content with OpenAI:", error);

    // Fallback to basic keyword check for critical cases if AI analysis fails
    const criticalKeywords = ["suicide", "kill", "die", "hurt myself", "abuse"];
    const lowerMessage = message.toLowerCase();
    const hasCriticalKeyword = criticalKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    return {
      isCritical: hasCriticalKeyword,
      reason: hasCriticalKeyword
        ? "Critical keyword detected (fallback analysis)"
        : undefined,
    };
  }
}

// Update checkForAlert to use AI-powered analysis
async function checkForAlert(mood: any, message: string): Promise<boolean> {
  try {
    // First check message content using AI
    const criticalAnalysis = await analyzeCriticalContent(message);
    if (criticalAnalysis.isCritical) {
      return true;
    }

    // Then check mood scores as a secondary indicator
    if (mood?.anxiety >= 7 || mood?.stress >= 7 || mood?.sadness >= 7) {
      return true;
    }

    // Alert if very low happiness and confidence
    if (mood?.happiness <= 2 && mood?.confidence <= 2) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in checkForAlert:", error);
    // Fallback to mood-based check only if AI analysis fails
    return !!(
      mood?.anxiety >= 7 ||
      mood?.stress >= 7 ||
      mood?.sadness >= 7 ||
      (mood?.happiness <= 2 && mood?.confidence <= 2)
    );
  }
}

function determineAlertLevel(mood: any, message: string): "high" | "medium" {
  // High alert for severe symptoms
  if (mood.anxiety >= 8 || mood.sadness >= 8 || mood.stress >= 8) {
    return "high";
  }

  if (mood.happiness <= 1 || mood.confidence <= 1) {
    return "high";
  }

  return "medium";
}

function generateAlertMessage(
  mood: any,
  message: string,
  level: "high" | "medium"
): string {
  const concerns = [];

  if (mood.anxiety >= 7) concerns.push("elevated anxiety");
  if (mood.sadness >= 7) concerns.push("significant sadness");
  if (mood.stress >= 7) concerns.push("high stress levels");
  if (mood.confidence <= 3) concerns.push("low self-confidence");

  const concernsText =
    concerns.length > 0 ? concerns.join(", ") : "emotional distress";

  if (level === "high") {
    return `Your child is experiencing ${concernsText} and may need immediate support. Consider scheduling a check-in conversation or contacting a mental health professional. Recent message indicated significant emotional distress.`;
  } else {
    return `Your child is showing signs of ${concernsText}. This might be a good time to check in with them about how they're feeling and offer some extra support.`;
  }
}

// GET endpoint to retrieve session history
export async function GET(request: NextRequest) {
  const family = await getAuthenticatedFamilyFromToken();

  if (!family) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const childId = searchParams.get("childId");

  const supabase = createServerSupabase();

  let query = supabase
    .from("therapy_sessions")
    .select(
      `
      *,
      children!inner(
        id,
        name,
        family_id
      )
    `
    )
    .eq("children.family_id", family.id);

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data: sessions, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }

  // Process sessions to ensure mood analysis is available
  const processedSessions = await Promise.all(
    (sessions || []).map(async (session) => {
      let moodAnalysis = session.mood_analysis;

      // Get all child messages from the messages array
      const messages = session.messages || [];
      const childMessages = messages
        .filter((msg: Message) => msg.sender === "child")
        .map((msg: Message) => msg.content)
        .join("\n");

      const aiMessages = messages
        .filter((msg: Message) => msg.sender === "ai")
        .map((msg: Message) => msg.content)
        .join("\n");

      // Always re-analyze mood from the child messages to ensure accuracy
      if (childMessages) {
        moodAnalysis = await analyzeMoodFromMessage(childMessages, aiMessages);
      }

      // Extract topics from the messages
      const topics = childMessages
        ? await extractTopicsFromMessage(childMessages)
        : ["General conversation"];

      // Check for alerts
      const hasAlert = moodAnalysis
        ? checkForAlert(moodAnalysis, childMessages)
        : false;
      const alertLevel =
        hasAlert && moodAnalysis
          ? determineAlertLevel(moodAnalysis, childMessages)
          : null;
      const alertMessage =
        hasAlert && moodAnalysis
          ? generateAlertMessage(
              moodAnalysis,
              childMessages,
              alertLevel as "high" | "medium"
            )
          : null;

      // Add date information for better analysis
      const sessionDate = new Date(session.created_at)
        .toISOString()
        .split("T")[0];
      const sessionTime = new Date(session.created_at)
        .toTimeString()
        .split(" ")[0];

      return {
        ...session,
        mood_analysis: moodAnalysis,
        topics,
        has_alert: hasAlert,
        alert_level: alertLevel,
        alert_message: alertMessage,
        session_duration:
          session.session_duration || calculateSessionDuration(messages),
        session_date: sessionDate,
        session_time: sessionTime,
        // Enhanced analysis data
        analysis_metadata: {
          word_count: childMessages ? childMessages.split(" ").length : 0,
          response_length: aiMessages.length,
          emotional_intensity: moodAnalysis
            ? Math.max(
                moodAnalysis.anxiety,
                moodAnalysis.sadness,
                moodAnalysis.stress
              )
            : 0,
          positive_indicators: moodAnalysis
            ? moodAnalysis.happiness + moodAnalysis.confidence
            : 0,
          concern_indicators: moodAnalysis
            ? moodAnalysis.anxiety + moodAnalysis.sadness + moodAnalysis.stress
            : 0,
        },
      };
    })
  );

  // Group sessions by date for better analysis
  const groupedSessions = groupSessionsByDate(processedSessions);

  return NextResponse.json({
    sessions: processedSessions,
    groupedSessions,
    summary: {
      totalSessions: processedSessions.length,
      totalDays: groupedSessions.length,
      averageSessionsPerDay:
        groupedSessions.length > 0
          ? (processedSessions.length / groupedSessions.length).toFixed(1)
          : 0,
      dateRange:
        groupedSessions.length > 0
          ? {
              start: groupedSessions[0].date,
              end: groupedSessions[groupedSessions.length - 1].date,
            }
          : null,
      totalDuration: processedSessions.reduce(
        (sum, s) => sum + (s.session_duration || 0),
        0
      ),
      averageDuration:
        processedSessions.length > 0
          ? Math.round(
              processedSessions.reduce(
                (sum, s) => sum + (s.session_duration || 0),
                0
              ) / processedSessions.length
            )
          : 0,
    },
  });
}

export async function POST(request: NextRequest) {
  const family = await getAuthenticatedFamilyFromToken();

  if (!family) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { childId, messages, moodAnalysis, sessionSummary } =
      await request.json();

    if (!childId || !messages) {
      return NextResponse.json(
        { error: "Child ID and messages are required" },
        { status: 400 }
      );
    }

    // Verify child belongs to this family
    const supabase = createServerSupabase();
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id")
      .eq("id", childId)
      .eq("family_id", family.id)
      .eq("is_active", true)
      .single();

    if (childError || !child) {
      return NextResponse.json(
        { error: "Child not found or access denied" },
        { status: 404 }
      );
    }

    // Get all child messages and AI responses
    const childMessages = messages
      .filter((msg: Message) => msg.sender === "child")
      .map((msg: Message) => msg.content)
      .join("\n");

    const aiMessages = messages
      .filter((msg: Message) => msg.sender === "ai")
      .map((msg: Message) => msg.content)
      .join("\n");

    // Analyze mood if not provided
    let finalMoodAnalysis = moodAnalysis;
    if (!finalMoodAnalysis && childMessages) {
      finalMoodAnalysis = await analyzeMoodFromMessage(
        childMessages,
        aiMessages
      );
    }

    // Extract topics
    const topics = childMessages
      ? await extractTopicsFromMessage(childMessages)
      : ["General conversation"];

    // Check for alerts - now async
    const hasAlert = await checkForAlert(finalMoodAnalysis, childMessages);
    const alertLevel =
      hasAlert && finalMoodAnalysis
        ? determineAlertLevel(finalMoodAnalysis, childMessages)
        : null;
    const alertMessage =
      hasAlert && finalMoodAnalysis
        ? generateAlertMessage(
            finalMoodAnalysis,
            childMessages,
            alertLevel as "high" | "medium"
          )
        : null;

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from("therapy_sessions")
      .insert({
        child_id: childId,
        messages: messages,
        mood_analysis: finalMoodAnalysis,
        session_summary: sessionSummary || null,
        session_duration: calculateSessionDuration(messages),
        topics: topics,
        has_alert: hasAlert,
        alert_level: alertLevel,
        alert_message: alertMessage,
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Error creating session:", sessionError);
      return NextResponse.json(
        { error: "Failed to save session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: session,
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateSessionDuration(messages: any[]): number {
  if (messages.length < 2) return 0;

  const firstMessage = new Date(
    messages[0].timestamp || messages[0].created_at || Date.now()
  );
  const lastMessage = new Date(
    messages[messages.length - 1].timestamp ||
      messages[messages.length - 1].created_at ||
      Date.now()
  );

  return Math.floor((lastMessage.getTime() - firstMessage.getTime()) / 1000);
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

    // Calculate daily engagement metrics
    const totalWordCount = daySessions.reduce(
      (sum, session) => sum + (session.analysis_metadata?.word_count || 0),
      0
    );
    const totalResponseLength = daySessions.reduce(
      (sum, session) => sum + (session.analysis_metadata?.response_length || 0),
      0
    );
    const avgEmotionalIntensity =
      daySessions.reduce(
        (sum, session) =>
          sum + (session.analysis_metadata?.emotional_intensity || 0),
        0
      ) / daySessions.length;
    const avgPositiveIndicators =
      daySessions.reduce(
        (sum, session) =>
          sum + (session.analysis_metadata?.positive_indicators || 0),
        0
      ) / daySessions.length;
    const avgConcernIndicators =
      daySessions.reduce(
        (sum, session) =>
          sum + (session.analysis_metadata?.concern_indicators || 0),
        0
      ) / daySessions.length;

    grouped.push({
      date,
      sessionCount: daySessions.length,
      totalDuration,
      averageMood: avgMood,
      topics: allTopics,
      hasAlert,
      alertLevel,
      engagementMetrics: {
        totalWordCount,
        totalResponseLength,
        averageEmotionalIntensity: Math.round(avgEmotionalIntensity * 10) / 10,
        averagePositiveIndicators: Math.round(avgPositiveIndicators * 10) / 10,
        averageConcernIndicators: Math.round(avgConcernIndicators * 10) / 10,
      },
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
