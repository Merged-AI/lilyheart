import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedFamilyFromToken } from "@/lib/supabase-auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get the most recent active child from the authenticated family
async function getMostRecentChild(familyId: string): Promise<string | null> {
  try {
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

// Validate child belongs to authenticated family
async function validateChildAccess(
  familyId: string,
  childId: string
): Promise<boolean> {
  try {
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

// Analyze mood using OpenAI for accurate emotional assessment
async function analyzeMoodFromInput(
  input: string,
  childAge?: number
): Promise<any> {
  try {
    const prompt = `Analyze the emotional state of a child based on their mood input or description. Provide a detailed mood analysis with scores from 1-10 for each dimension.

Child's mood input: "${input}"
${childAge ? `Child's age: ${childAge} years` : ""}

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
- Severe anxiety or depression

For concerning content, use appropriate high scores for anxiety, sadness, and stress.

Respond with a JSON object only:
{
  "happiness": number,
  "anxiety": number,
  "sadness": number,
  "stress": number,
  "confidence": number,
  "insights": "Brief clinical observation about the emotional state"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a child psychologist specializing in emotional assessment. Provide accurate, nuanced mood analysis based on the child's mood input or description.",
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

// Analyze mood status and provide insights
function analyzeMoodStatus(moodEntries: any[]) {
  if (moodEntries.length === 0) {
    return {
      status: "No Data",
      level: "neutral",
      trend: "stable",
      insights: "No mood data available yet",
      recommendations: [
        "Start tracking daily mood",
        "Encourage regular check-ins",
      ],
      currentAverages: {
        happiness: 5,
        anxiety: 5,
        sadness: 5,
        stress: 5,
        confidence: 5,
      },
    };
  }

  const recentEntries = moodEntries.slice(-3); // Last 3 entries

  // Calculate current averages
  const currentAverages = {
    happiness: Math.round(
      recentEntries.reduce((sum, entry) => sum + entry.happiness, 0) /
        recentEntries.length
    ),
    anxiety: Math.round(
      recentEntries.reduce((sum, entry) => sum + entry.anxiety, 0) /
        recentEntries.length
    ),
    sadness: Math.round(
      recentEntries.reduce((sum, entry) => sum + entry.sadness, 0) /
        recentEntries.length
    ),
    stress: Math.round(
      recentEntries.reduce((sum, entry) => sum + entry.stress, 0) /
        recentEntries.length
    ),
    confidence: Math.round(
      recentEntries.reduce((sum, entry) => sum + entry.confidence, 0) /
        recentEntries.length
    ),
  };

  // Determine overall mood status with more sensitive thresholds
  let status = "Stable";
  let level = "neutral";
  let insights = "Mood appears to be within normal range";
  let recommendations = [
    "Continue regular check-ins",
    "Maintain supportive environment",
  ];

  // Check for concerning patterns with more sensitive detection
  const highStress =
    currentAverages.anxiety >= 6 ||
    currentAverages.sadness >= 6 ||
    currentAverages.stress >= 6;
  const lowConfidence = currentAverages.confidence <= 4;
  const highHappiness = currentAverages.happiness >= 8;
  const veryHighStress =
    currentAverages.anxiety >= 8 ||
    currentAverages.sadness >= 8 ||
    currentAverages.stress >= 8;

  if (veryHighStress) {
    status = "Needs Immediate Attention";
    level = "critical";
    insights = "Significantly elevated levels of anxiety, sadness, or stress detected - immediate support recommended";
    recommendations = [
      "Schedule immediate quality time together",
      "Practice relaxation techniques",
      "Consider professional support",
      "Monitor for concerning behaviors",
    ];
  } else if (highStress) {
    status = "Needs Attention";
    level = "concerning";
    insights = "Elevated levels of anxiety, sadness, or stress detected";
    recommendations = [
      "Schedule quality time together",
      "Practice relaxation techniques",
      "Consider professional support if needed",
      "Monitor emotional patterns",
    ];
  } else if (lowConfidence) {
    status = "Confidence Building Needed";
    level = "moderate";
    insights = "Low confidence levels may need support and encouragement";
    recommendations = [
      "Focus on building self-esteem",
      "Celebrate small achievements",
      "Encourage positive self-talk",
      "Provide reassurance and support",
    ];
  } else if (highHappiness) {
    status = "Positive";
    level = "positive";
    insights = "Child is showing positive emotional well-being";
    recommendations = [
      "Maintain supportive environment",
      "Continue positive reinforcement",
      "Encourage continued engagement",
    ];
  }

  // Calculate trend with more sensitive detection
  let trend = "stable";
  if (moodEntries.length >= 2) {
    const previousEntries = moodEntries.slice(-4, -1);
    if (previousEntries.length > 0) {
      const previousAverages = {
        happiness: Math.round(
          previousEntries.reduce((sum, entry) => sum + entry.happiness, 0) / previousEntries.length
        ),
        anxiety: Math.round(
          previousEntries.reduce((sum, entry) => sum + entry.anxiety, 0) / previousEntries.length
        ),
        sadness: Math.round(
          previousEntries.reduce((sum, entry) => sum + entry.sadness, 0) / previousEntries.length
        ),
        stress: Math.round(
          previousEntries.reduce((sum, entry) => sum + entry.stress, 0) / previousEntries.length
        ),
      };

      const currentStress =
        (currentAverages.anxiety +
          currentAverages.sadness +
          currentAverages.stress) /
        3;
      const previousStress =
        (previousAverages.anxiety +
          previousAverages.sadness +
          previousAverages.stress) /
        3;

      if (currentStress < previousStress - 0.5) {
        trend = "improving";
      } else if (currentStress > previousStress + 0.5) {
        trend = "declining";
      }
    }
  }

  return {
    status,
    level,
    trend,
    insights,
    recommendations,
    currentAverages,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const requestedChildId = searchParams.get("childId");
    const forceRefresh = searchParams.get("forceRefresh") === "true";
    const forceAll = searchParams.get("forceAll") === "true";

    // Get authenticated family
    const family = await getAuthenticatedFamilyFromToken();
    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Determine which child to track
    let childId = requestedChildId;
    if (!childId) {
      childId = await getMostRecentChild(family.id);
    }

    if (!childId) {
      return NextResponse.json(
        { error: "No active children found. Please register a child first." },
        { status: 404 }
      );
    }

    // Validate child access
    const hasAccess = await validateChildAccess(family.id, childId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this child" },
        { status: 403 }
      );
    }

    // Get child information
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id, name, age, current_mood")
      .eq("id", childId)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Fetch therapy sessions with mood analysis for the specified date range
    const { data: sessions, error: sessionsError } = await supabase
      .from("therapy_sessions")
      .select("id, created_at, mood_analysis, user_message, ai_response")
      .eq("child_id", childId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (sessionsError) {
      console.error("Error fetching therapy sessions:", sessionsError);
      return NextResponse.json(
        {
          error: "Failed to fetch therapy sessions",
        },
        { status: 500 }
      );
    }

    // Transform therapy sessions into mood tracking entries
    const moodEntries = [];
    const processedDates = new Set();

    for (const session of sessions || []) {
      const sessionDate = session.created_at.split("T")[0];
      
      // Skip if we already have an entry for this date (take the latest session of the day)
      if (processedDates.has(sessionDate)) {
        continue;
      }
      processedDates.add(sessionDate);

      if (session.mood_analysis) {
        // Create mood entry from session mood analysis
        const moodEntry = {
          id: session.id,
          child_id: childId,
          happiness: session.mood_analysis.happiness || 5,
          anxiety: session.mood_analysis.anxiety || 5,
          sadness: session.mood_analysis.sadness || 5,
          stress: session.mood_analysis.stress || 5,
          confidence: session.mood_analysis.confidence || 5,
          notes: session.mood_analysis.insights || 
                 `Session: ${session.user_message?.substring(0, 100)}...`,
          recorded_at: session.created_at,
          session_id: session.id,
        };

        moodEntries.push(moodEntry);
      }
    }

    // If no sessions with mood analysis, try to analyze existing sessions
    if (moodEntries.length === 0 && sessions && sessions.length > 0) {
      console.log("No mood analysis found in sessions, analyzing existing sessions...");
      
      for (const session of sessions.slice(0, 7)) { // Limit to 7 sessions
        const sessionDate = session.created_at.split("T")[0];
        
        if (processedDates.has(sessionDate)) {
          continue;
        }
        processedDates.add(sessionDate);

        if (session.user_message) {
          try {
            // Analyze mood from session content
            const aiMoodAnalysis = await analyzeMoodFromInput(
              session.user_message,
              child.age
            );

            const moodEntry = {
              id: session.id,
              child_id: childId,
              happiness: aiMoodAnalysis.happiness,
              anxiety: aiMoodAnalysis.anxiety,
              sadness: aiMoodAnalysis.sadness,
              stress: aiMoodAnalysis.stress,
              confidence: aiMoodAnalysis.confidence,
              notes: `[Session Analysis: ${aiMoodAnalysis.insights}] ${session.user_message.substring(0, 100)}...`,
              recorded_at: session.created_at,
              session_id: session.id,
            };

            moodEntries.push(moodEntry);
          } catch (error) {
            console.error(`Error analyzing session ${session.id}:`, error);
          }
        }
      }
    }

    // Transform data for chart display
    const moodData = moodEntries.map((entry) => ({
      date: entry.recorded_at.split("T")[0],
      happiness: entry.happiness,
      anxiety: entry.anxiety,
      sadness: entry.sadness,
      stress: entry.stress,
      confidence: entry.confidence,
      notes: entry.notes || "",
      session_id: entry.session_id,
    }));

    // Analyze mood status with the entries
    const moodAnalysis = analyzeMoodStatus(moodEntries);
    
    // Check if we have any real mood data
    const hasRealMoodData = moodEntries.some(entry => {
      const hasNonNeutralScores = 
        (entry.happiness !== 5 && entry.happiness !== null) ||
        (entry.anxiety !== 5 && entry.anxiety !== null) ||
        (entry.sadness !== 5 && entry.sadness !== null) ||
        (entry.stress !== 5 && entry.stress !== null) ||
        (entry.confidence !== 5 && entry.confidence !== null);
      
      const hasMeaningfulNotes = entry.notes && 
        entry.notes.trim().length > 0 && 
        !entry.notes.includes('[AI Re-analyzed: Unable to analyze mood') &&
        !entry.notes.includes('[AI Re-analyzed: No mood data available yet]');
      
      return hasNonNeutralScores || hasMeaningfulNotes;
    });

    // If no real mood data, generate baseline data for the chart
    if (!hasRealMoodData) {
      const baselineData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        baselineData.push({
          date: date.toISOString().split("T")[0],
          happiness: 5,
          anxiety: 5,
          sadness: 5,
          stress: 5,
          confidence: 5,
          notes: "",
        });
      }

      return NextResponse.json({
        child: {
          id: child.id,
          name: child.name,
          age: child.age,
        },
        moodData: baselineData,
        moodAnalysis: {
          status: "No Data",
          level: "neutral",
          trend: "stable",
          insights: "No mood data available yet",
          recommendations: [
            "Start tracking daily mood",
            "Encourage regular check-ins",
          ],
          currentAverages: {
            happiness: 5,
            anxiety: 5,
            sadness: 5,
            stress: 5,
            confidence: 5,
          },
        },
        totalEntries: 0,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
        },
        message: "No mood data yet - showing baseline",
      });
    }

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
      },
      moodData,
      moodAnalysis,
      totalEntries: moodEntries.length,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      lastUpdated:
        moodEntries[moodEntries.length - 1]?.recorded_at,
      source: "therapy_sessions",
    });
  } catch (error) {
    console.error("Error in mood tracking API:", error);

    return NextResponse.json(
      {
        error: "Failed to process mood tracking request",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      childId,
      happiness,
      anxiety,
      sadness,
      stress,
      confidence,
      notes,
      moodDescription,
    } = await request.json();

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

    // Validate child access
    const hasAccess = await validateChildAccess(family.id, childId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this child" },
        { status: 403 }
      );
    }

    // Get child information for age context
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id, name, age")
      .eq("id", childId)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    let finalMood = {
      happiness: happiness || 5,
      anxiety: anxiety || 5,
      sadness: sadness || 5,
      stress: stress || 5,
      confidence: confidence || 5,
    };

    // If mood description is provided, use OpenAI to analyze it
    if (moodDescription && moodDescription.trim()) {
      try {
        const aiMoodAnalysis = await analyzeMoodFromInput(
          moodDescription,
          child.age
        );
        finalMood = {
          happiness: aiMoodAnalysis.happiness,
          anxiety: aiMoodAnalysis.anxiety,
          sadness: aiMoodAnalysis.sadness,
          stress: aiMoodAnalysis.stress,
          confidence: aiMoodAnalysis.confidence,
        };

        // Update notes with AI insights if available
        const updatedNotes = notes
          ? `${notes}\n\nAI Analysis: ${aiMoodAnalysis.insights}`
          : `AI Analysis: ${aiMoodAnalysis.insights}`;

        // Check for duplicate entry today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: existingEntry } = await supabase
          .from("mood_tracking")
          .select("id")
          .eq("child_id", childId)
          .gte("recorded_at", today.toISOString())
          .lt("recorded_at", tomorrow.toISOString())
          .single();

        if (existingEntry) {
          return NextResponse.json(
            {
              error: "Mood entry already exists for today. Use PUT to update.",
            },
            { status: 409 }
          );
        }

        // Insert mood tracking entry with AI analysis
        const { data: moodEntry, error } = await supabase
          .from("mood_tracking")
          .insert({
            child_id: childId,
            happiness: finalMood.happiness,
            anxiety: finalMood.anxiety,
            sadness: finalMood.sadness,
            stress: finalMood.stress,
            confidence: finalMood.confidence,
            notes: updatedNotes,
            recorded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating mood entry:", error);
          return NextResponse.json(
            { error: "Failed to save mood data" },
            { status: 500 }
          );
        }

        // Update child's current mood
        const { error: updateError } = await supabase
          .from("children")
          .update({
            current_mood: finalMood,
          })
          .eq("id", childId);

        if (updateError) {
          console.error("Error updating child current mood:", updateError);
        }

        // Analyze the new mood entry
        const moodAnalysis = analyzeMoodStatus([moodEntry]);

        return NextResponse.json({
          success: true,
          moodEntry,
          moodAnalysis,
          aiAnalysis: aiMoodAnalysis,
          message: "Mood entry saved successfully with AI analysis",
        });
      } catch (aiError) {
        console.error("Error with AI mood analysis:", aiError);
        // Fall back to manual input if AI analysis fails
      }
    }

    // Fallback to manual input validation if no mood description or AI analysis failed
    const validateMoodValue = (value: number, name: string) => {
      if (typeof value !== "number" || value < 1 || value > 10) {
        throw new Error(`${name} must be a number between 1 and 10`);
      }
      return value;
    };

    const validatedMood = {
      happiness: validateMoodValue(finalMood.happiness, "Happiness"),
      anxiety: validateMoodValue(finalMood.anxiety, "Anxiety"),
      sadness: validateMoodValue(finalMood.sadness, "Sadness"),
      stress: validateMoodValue(finalMood.stress, "Stress"),
      confidence: validateMoodValue(finalMood.confidence, "Confidence"),
    };

    // Check for duplicate entry today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existingEntry } = await supabase
      .from("mood_tracking")
      .select("id")
      .eq("child_id", childId)
      .gte("recorded_at", today.toISOString())
      .lt("recorded_at", tomorrow.toISOString())
      .single();

    if (existingEntry) {
      return NextResponse.json(
        { error: "Mood entry already exists for today. Use PUT to update." },
        { status: 409 }
      );
    }

    // Insert mood tracking entry
    const { data: moodEntry, error } = await supabase
      .from("mood_tracking")
      .insert({
        child_id: childId,
        happiness: validatedMood.happiness,
        anxiety: validatedMood.anxiety,
        sadness: validatedMood.sadness,
        stress: validatedMood.stress,
        confidence: validatedMood.confidence,
        notes: notes || "",
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating mood entry:", error);
      return NextResponse.json(
        { error: "Failed to save mood data" },
        { status: 500 }
      );
    }

    // Update child's current mood
    const { error: updateError } = await supabase
      .from("children")
      .update({
        current_mood: validatedMood,
      })
      .eq("id", childId);

    if (updateError) {
      console.error("Error updating child current mood:", updateError);
    }

    // Analyze the new mood entry
    const moodAnalysis = analyzeMoodStatus([moodEntry]);

    return NextResponse.json({
      success: true,
      moodEntry,
      moodAnalysis,
      message: "Mood entry saved successfully",
    });
  } catch (error) {
    console.error("Error in mood tracking POST:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process mood tracking entry",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      childId,
      happiness,
      anxiety,
      sadness,
      stress,
      confidence,
      notes,
      moodDescription,
    } = await request.json();

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

    // Validate child access
    const hasAccess = await validateChildAccess(family.id, childId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this child" },
        { status: 403 }
      );
    }

    // Get child information for age context
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id, name, age")
      .eq("id", childId)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    let finalMood = {
      happiness: happiness || 5,
      anxiety: anxiety || 5,
      sadness: sadness || 5,
      stress: stress || 5,
      confidence: confidence || 5,
    };

    // If mood description is provided, use OpenAI to analyze it
    if (moodDescription && moodDescription.trim()) {
      try {
        const aiMoodAnalysis = await analyzeMoodFromInput(
          moodDescription,
          child.age
        );
        finalMood = {
          happiness: aiMoodAnalysis.happiness,
          anxiety: aiMoodAnalysis.anxiety,
          sadness: aiMoodAnalysis.sadness,
          stress: aiMoodAnalysis.stress,
          confidence: aiMoodAnalysis.confidence,
        };

        // Update notes with AI insights if available
        const updatedNotes = notes
          ? `${notes}\n\nAI Analysis: ${aiMoodAnalysis.insights}`
          : `AI Analysis: ${aiMoodAnalysis.insights}`;

        // Find today's entry
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: existingEntry, error: findError } = await supabase
          .from("mood_tracking")
          .select("id")
          .eq("child_id", childId)
          .gte("recorded_at", today.toISOString())
          .lt("recorded_at", tomorrow.toISOString())
          .single();

        if (findError || !existingEntry) {
          return NextResponse.json(
            {
              error:
                "No mood entry found for today. Use POST to create a new entry.",
            },
            { status: 404 }
          );
        }

        // Update mood tracking entry with AI analysis
        const { data: moodEntry, error } = await supabase
          .from("mood_tracking")
          .update({
            happiness: finalMood.happiness,
            anxiety: finalMood.anxiety,
            sadness: finalMood.sadness,
            stress: finalMood.stress,
            confidence: finalMood.confidence,
            notes: updatedNotes,
            recorded_at: new Date().toISOString(),
          })
          .eq("id", existingEntry.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating mood entry:", error);
          return NextResponse.json(
            { error: "Failed to update mood data" },
            { status: 500 }
          );
        }

        // Update child's current mood
        const { error: updateError } = await supabase
          .from("children")
          .update({
            current_mood: finalMood,
          })
          .eq("id", childId);

        if (updateError) {
          console.error("Error updating child current mood:", updateError);
        }

        // Analyze the updated mood entry
        const moodAnalysis = analyzeMoodStatus([moodEntry]);

        return NextResponse.json({
          success: true,
          moodEntry,
          moodAnalysis,
          aiAnalysis: aiMoodAnalysis,
          message: "Mood entry updated successfully with AI analysis",
        });
      } catch (aiError) {
        console.error("Error with AI mood analysis:", aiError);
        // Fall back to manual input if AI analysis fails
      }
    }

    // Fallback to manual input validation if no mood description or AI analysis failed
    const validateMoodValue = (value: number, name: string) => {
      if (typeof value !== "number" || value < 1 || value > 10) {
        throw new Error(`${name} must be a number between 1 and 10`);
      }
      return value;
    };

    const validatedMood = {
      happiness: validateMoodValue(finalMood.happiness, "Happiness"),
      anxiety: validateMoodValue(finalMood.anxiety, "Anxiety"),
      sadness: validateMoodValue(finalMood.sadness, "Sadness"),
      stress: validateMoodValue(finalMood.stress, "Stress"),
      confidence: validateMoodValue(finalMood.confidence, "Confidence"),
    };

    // Find today's entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existingEntry, error: findError } = await supabase
      .from("mood_tracking")
      .select("id")
      .eq("child_id", childId)
      .gte("recorded_at", today.toISOString())
      .lt("recorded_at", tomorrow.toISOString())
      .single();

    if (findError || !existingEntry) {
      return NextResponse.json(
        {
          error:
            "No mood entry found for today. Use POST to create a new entry.",
        },
        { status: 404 }
      );
    }

    // Update mood tracking entry
    const { data: moodEntry, error } = await supabase
      .from("mood_tracking")
      .update({
        happiness: validatedMood.happiness,
        anxiety: validatedMood.anxiety,
        sadness: validatedMood.sadness,
        stress: validatedMood.stress,
        confidence: validatedMood.confidence,
        notes: notes || "",
        recorded_at: new Date().toISOString(),
      })
      .eq("id", existingEntry.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating mood entry:", error);
      return NextResponse.json(
        { error: "Failed to update mood data" },
        { status: 500 }
      );
    }

    // Update child's current mood
    const { error: updateError } = await supabase
      .from("children")
      .update({
        current_mood: validatedMood,
      })
      .eq("id", childId);

    if (updateError) {
      console.error("Error updating child current mood:", updateError);
    }

    // Analyze the updated mood entry
    const moodAnalysis = analyzeMoodStatus([moodEntry]);

    return NextResponse.json({
      success: true,
      moodEntry,
      moodAnalysis,
      message: "Mood entry updated successfully",
    });
  } catch (error) {
    console.error("Error in mood tracking PUT:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update mood tracking entry",
      },
      { status: 500 }
    );
  }
}

// Quick mood analysis endpoint - doesn't save to database
export async function PATCH(request: NextRequest) {
  try {
    const { childId, moodDescription } = await request.json();

    if (!childId || !moodDescription) {
      return NextResponse.json(
        { error: "Child ID and mood description are required" },
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

    // Validate child access
    const hasAccess = await validateChildAccess(family.id, childId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this child" },
        { status: 403 }
      );
    }

    // Get child information for age context
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id, name, age")
      .eq("id", childId)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Analyze mood using OpenAI
    const aiMoodAnalysis = await analyzeMoodFromInput(
      moodDescription,
      child.age
    );

    return NextResponse.json({
      success: true,
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
      },
      moodAnalysis: aiMoodAnalysis,
      message: "Mood analysis completed successfully",
    });
  } catch (error) {
    console.error("Error in mood analysis PATCH:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to analyze mood",
      },
      { status: 500 }
    );
  }
}

// Test endpoint to force re-analysis of all mood entries
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedChildId = searchParams.get("childId");

    if (!requestedChildId) {
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

    // Validate child access
    const hasAccess = await validateChildAccess(family.id, requestedChildId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this child" },
        { status: 403 }
      );
    }

    // Get child information
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("id, name, age")
      .eq("id", requestedChildId)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Fetch all mood entries for this child
    const { data: moodEntries, error } = await supabase
      .from("mood_tracking")
      .select("*")
      .eq("child_id", requestedChildId)
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("Error fetching mood data:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch mood data",
        },
        { status: 500 }
      );
    }

    let reanalyzedCount = 0;
    const results = [];

    for (const entry of moodEntries) {
      try {
        let analysisInput = entry.notes || "";

        // If no notes, use a more sophisticated default analysis
        if (!entry.notes || entry.notes.trim().length === 0) {
          const entryDate = new Date(entry.recorded_at);
          const isWeekend =
            entryDate.getDay() === 0 || entryDate.getDay() === 6;
          const isRecent =
            Date.now() - entryDate.getTime() < 7 * 24 * 60 * 60 * 1000;

          analysisInput = `Child mood entry from ${entryDate.toLocaleDateString()}${
            isWeekend ? " (weekend)" : " (weekday)"
          }${
            isRecent ? " - recent entry" : " - older entry"
          }. No specific notes provided, analyzing for baseline emotional state and potential patterns.`;
        }

        // Re-analyze using the notes or default input
        const aiMoodAnalysis = await analyzeMoodFromInput(
          analysisInput,
          child.age
        );

        // Add some randomization for empty notes
        if (!entry.notes || entry.notes.trim().length === 0) {
          const randomVariation = Math.random() * 0.4 - 0.2;
          aiMoodAnalysis.happiness = Math.max(
            1,
            Math.min(10, aiMoodAnalysis.happiness + randomVariation)
          );
          aiMoodAnalysis.anxiety = Math.max(
            1,
            Math.min(10, aiMoodAnalysis.anxiety + randomVariation)
          );
          aiMoodAnalysis.sadness = Math.max(
            1,
            Math.min(10, aiMoodAnalysis.sadness + randomVariation)
          );
          aiMoodAnalysis.stress = Math.max(
            1,
            Math.min(10, aiMoodAnalysis.stress + randomVariation)
          );
          aiMoodAnalysis.confidence = Math.max(
            1,
            Math.min(10, aiMoodAnalysis.confidence + randomVariation)
          );
        }

        // Update the entry with AI analysis
        const { data: updatedMoodEntry, error: updateError } = await supabase
          .from("mood_tracking")
          .update({
            happiness: Math.round(aiMoodAnalysis.happiness),
            anxiety: Math.round(aiMoodAnalysis.anxiety),
            sadness: Math.round(aiMoodAnalysis.sadness),
            stress: Math.round(aiMoodAnalysis.stress),
            confidence: Math.round(aiMoodAnalysis.confidence),
            notes:
              !entry.notes || entry.notes.trim().length === 0
                ? `[AI Re-analyzed: ${aiMoodAnalysis.insights}]`
                : `${entry.notes}\n\n[AI Re-analyzed: ${aiMoodAnalysis.insights}]`,
          })
          .eq("id", entry.id)
          .select()
          .single();

        if (!updateError && updatedMoodEntry) {
          reanalyzedCount++;
          results.push({
            id: entry.id,
            date: entry.recorded_at,
            oldScores: {
              happiness: entry.happiness,
              anxiety: entry.anxiety,
              sadness: entry.sadness,
              stress: entry.stress,
              confidence: entry.confidence,
            },
            newScores: {
              happiness: updatedMoodEntry.happiness,
              anxiety: updatedMoodEntry.anxiety,
              sadness: updatedMoodEntry.sadness,
              stress: updatedMoodEntry.stress,
              confidence: updatedMoodEntry.confidence,
            },
            success: true,
          });
        } else {
          results.push({
            id: entry.id,
            date: entry.recorded_at,
            error: updateError,
            success: false,
          });
          console.error(`Failed to update entry ${entry.id}:`, updateError);
        }
      } catch (aiError) {
        console.error(
          `Error force re-analyzing mood entry ${entry.id}:`,
          aiError
        );
        results.push({
          id: entry.id,
          date: entry.recorded_at,
          error: aiError instanceof Error ? aiError.message : "Unknown error",
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Force re-analyzed ${reanalyzedCount} out of ${moodEntries.length} mood entries`,
      results,
      totalEntries: moodEntries.length,
      reanalyzedCount,
    });
  } catch (error) {
    console.error("Error in force re-analysis:", error);

    return NextResponse.json(
      {
        error: "Failed to force re-analyze mood entries",
      },
      { status: 500 }
    );
  }
}
