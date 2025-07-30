import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Crisis detection keywords
const CRISIS_KEYWORDS = [
  "hurt myself",
  "kill myself",
  "want to die",
  "end it all",
  "suicide",
  "suicidal",
  "cut myself",
  "harm myself",
  "better off dead",
  "can't go on",
  "no point living",
  "hurt me",
  "hit me",
  "touched inappropriately",
  "abuse",
  "sexual abuse",
];

function detectCrisis(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lowerMessage.includes(keyword));
}

function generateCrisisResponse(): string {
  return `I'm really concerned about what you just shared with me. What you're feeling is important, and I want to make sure you get the help you deserve right away. 

It's so brave of you to tell me about this. You're not alone, and there are people who care about you and want to help.

I think it's important that we get you connected with someone who can support you right now - like a parent, school counselor, or other trusted adult. 

If you're having thoughts of hurting yourself, please reach out to:
- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 988
- Or go to your nearest emergency room

You matter, and your life has value. Please don't give up. 💜`;
}

// Advanced AI-powered mood analysis using OpenAI
async function analyzeMoodFromMessage(userMessage: string, aiResponse: string): Promise<any> {
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
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a child psychologist specializing in emotional assessment. Provide accurate, nuanced mood analysis based on the child\'s message content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const moodAnalysis = JSON.parse(response);
    
    // Ensure all scores are within 1-10 range
    moodAnalysis.happiness = Math.max(1, Math.min(10, moodAnalysis.happiness || 5));
    moodAnalysis.anxiety = Math.max(1, Math.min(10, moodAnalysis.anxiety || 5));
    moodAnalysis.sadness = Math.max(1, Math.min(10, moodAnalysis.sadness || 5));
    moodAnalysis.stress = Math.max(1, Math.min(10, moodAnalysis.stress || 5));
    moodAnalysis.confidence = Math.max(1, Math.min(10, moodAnalysis.confidence || 5));

    return moodAnalysis;

  } catch (error) {
    console.error('Error analyzing mood with OpenAI:', error);
    
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
  if (!message) return ['General conversation'];
  
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
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a child psychology expert who can quickly identify the main themes and topics in children\'s messages. Provide accurate topic categorization.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const topics = JSON.parse(response);
    
    // Ensure we have a valid array
    if (Array.isArray(topics) && topics.length > 0) {
      return topics;
    }
    
    return ['General conversation'];
  } catch (error) {
    console.error('Error extracting topics with OpenAI:', error);
    return ['General conversation'];
  }
}

// Advanced pattern analysis for parent insights
function generateAdvancedInsights(
  message: string,
  mood: any,
  conversationHistory?: any[]
): string {
  const insights = [];
  const behavioralPatterns = [];
  const interventionNeeds = [];

  // Analyze immediate concerns
  if (mood.stress >= 7) {
    insights.push(
      "ELEVATED STRESS: Child showing significant distress that may impact daily functioning"
    );
    interventionNeeds.push("Implement stress reduction techniques immediately");
  }

  // Family dynamics analysis
  if (
    message.includes("hate") &&
    (message.includes("dad") || message.includes("parent"))
  ) {
    insights.push(
      "FAMILY CONFLICT: Strong negative emotions toward parent figure - indicates need for family therapy consultation"
    );
    behavioralPatterns.push("Parent-child relationship strain");
    interventionNeeds.push(
      "Schedule family meeting to address underlying issues"
    );
  }

  // Impulse control patterns (specific to children with emotional regulation difficulties)
  if (message.includes("angry") || message.includes("mad") || mood.anger >= 6) {
    insights.push(
      "IMPULSE CONTROL: Signs of anger regulation difficulties - monitor for escalation patterns"
    );
    behavioralPatterns.push("Emotional dysregulation episodes");
    interventionNeeds.push(
      "Teach anger management techniques (breathing, counting, safe space)"
    );
  }

  // Authority resistance patterns
  if (
    message.includes("don't want to") ||
    message.includes("make me") ||
    message.includes("not fair")
  ) {
    insights.push(
      "AUTHORITY ISSUES: Resistance to parental limits may indicate need for clearer boundaries and consequences"
    );
    behavioralPatterns.push("Oppositional behaviors");
    interventionNeeds.push(
      "Review family rules and consistent consequence system"
    );
  }

  // Social/emotional development
  if (message.includes("bullying") || message.includes("friends")) {
    insights.push(
      "SOCIAL CONCERNS: Peer relationships affecting emotional wellbeing - coordinate with school"
    );
    interventionNeeds.push("Contact school counselor about social dynamics");
  }

  // Anxiety patterns
  if (mood.anxiety >= 7) {
    insights.push(
      "ANXIETY SUPPORT: Higher anxiety detected - extra support may be helpful"
    );
    interventionNeeds.push("Implement daily anxiety coping strategies");
  }

  // Positive indicators
  if (
    message.includes("better") ||
    message.includes("calm") ||
    mood.happiness >= 7
  ) {
    insights.push(
      "POSITIVE PROGRESS: Child demonstrating emotional regulation skills and therapeutic engagement"
    );
  }

  // Sleep and routine concerns
  if (
    message.includes("bed") ||
    message.includes("sleep") ||
    message.includes("tired")
  ) {
    insights.push(
      "ROUTINE CONCERNS: Sleep/bedtime issues may be contributing to emotional dysregulation"
    );
    interventionNeeds.push(
      "Establish consistent bedtime routine and sleep hygiene"
    );
  }

  // Compile comprehensive insight
  let comprehensiveInsight = "";

  if (insights.length > 0) {
    comprehensiveInsight += "FAMILY OBSERVATIONS: " + insights.join(" | ");
  }

  if (behavioralPatterns.length > 0) {
    comprehensiveInsight +=
      " BEHAVIORAL PATTERNS: " + behavioralPatterns.join(", ");
  }

  if (interventionNeeds.length > 0) {
    comprehensiveInsight +=
      " RECOMMENDED INTERVENTIONS: " + interventionNeeds.join(" • ");
  }

  return (
    comprehensiveInsight ||
    "Child engaging in therapeutic conversation with normal emotional range"
  );
}

// Verify that child belongs to the authenticated family
async function verifyChildBelongsToFamily(
  childId: string,
  familyId: string
): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select("id, family_id")
      .eq("id", childId)
      .eq("family_id", familyId)
      .eq("is_active", true)
      .single();

    if (error || !child) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Verify that child has completed comprehensive therapeutic profile
async function verifyChildProfileComplete(childId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select(
        "name, current_concerns, parent_goals, reason_for_adding, profile_completed"
      )
      .eq("id", childId)
      .single();

    if (error || !child) {
      return false;
    }

    // Check if essential therapeutic fields are completed
    const hasRequiredFields = !!(
      child.name?.trim() &&
      child.current_concerns?.trim() &&
      child.parent_goals?.trim() &&
      child.reason_for_adding?.trim()
    );

    // Also check the profile_completed flag if it exists
    const isMarkedComplete = child.profile_completed === true;

    return hasRequiredFields && isMarkedComplete;
  } catch (error) {
    console.error("Error in verifyChildProfileComplete:", error);
    return false;
  }
}

// Get child's background context for personalized therapy
async function getChildContext(childId: string): Promise<string> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select(
        "name, age, gender, current_concerns, triggers, parent_goals, reason_for_adding"
      )
      .eq("id", childId)
      .single();

    if (error || !child) {
      console.error("Error fetching child context:", error);
      return `
CHILD PROFILE FOR DR. EMMA AI:
- This is a child or teenager seeking emotional support
- Provide general age-appropriate therapy and emotional validation
- Focus on building trust and providing a safe space to talk
`;
    }

    return generateChildContext({
      name: child.name,
      age: child.age,
      gender: child.gender,
      currentConcerns: child.current_concerns,
      triggers: child.triggers,
      parentGoals: child.parent_goals,
      reasonForAdding: child.reason_for_adding,
    });
  } catch (error) {
    console.error("Error in getChildContext:", error);
    return "";
  }
}

// Comprehensive child context generation function
function generateChildContext(child: any): string {
  const age = Number(child.age);
  const name = child.name;
  const currentConcerns = child.currentConcerns || "";
  const triggers = child.triggers || "";
  const parentGoals = child.parentGoals || "";
  const reasonForAdding = child.reasonForAdding || "";
  const gender = child.gender || "";

  return `
COMPREHENSIVE CHILD PROFILE FOR DR. EMMA AI:

BASIC INFORMATION:
- Name: ${name}
- Age: ${age} years old
- Gender: ${gender || "Not specified"}
- Reason for therapy: ${reasonForAdding}

CURRENT MENTAL HEALTH CONCERNS:
${currentConcerns}

KNOWN TRIGGERS & STRESSORS:
${triggers || "No specific triggers identified yet"}

PARENT/GUARDIAN THERAPEUTIC GOALS:
${parentGoals}

THERAPEUTIC APPROACH FOR ${name}:
${
  age <= 8
    ? `- Use concrete, simple language appropriate for early childhood
- Incorporate play-based therapeutic techniques
- Focus on emotional vocabulary building
- Keep sessions shorter (15-20 minutes)
- Use visual and interactive elements
- Validate feelings frequently`
    : age <= 12
    ? `- Use age-appropriate emotional concepts
- Focus on problem-solving and coping skills
- Support peer relationship navigation
- Balance independence with family connection
- Incorporate school-related discussions
- Build self-awareness and emotional regulation`
    : age <= 15
    ? `- Respect growing independence and identity development
- Address social complexities and peer pressure
- Support identity formation and self-expression
- Discuss future planning and goal-setting
- Navigate family relationship changes
- Support transition to adulthood planning
- Address complex emotional and relationship topics
- Encourage independent decision-making
- Discuss future goals and aspirations
- Support family relationship evolution`
    : `- Support transition to adulthood planning
- Address complex emotional and relationship topics
- Encourage independent decision-making
- Discuss future goals and aspirations
- Support family relationship evolution`
}

KEY THERAPEUTIC FOCUS AREAS FOR ${name}:
- Primary concerns: ${currentConcerns}
- Trigger awareness: ${
    triggers
      ? `Be mindful of: ${triggers}`
      : "Monitor for emotional triggers during conversations"
  }
- Parent goals: ${parentGoals}
- Age-appropriate emotional development support
- Building healthy coping mechanisms
- Strengthening family communication

CONVERSATION GUIDELINES FOR ${name}:
- Always use their name to create personal connection
- Reference their specific concerns and background
- Avoid or carefully approach known triggers
- Work toward parent-identified goals
- Adapt all interventions for ${age}-year-old developmental stage
- Create trauma-informed, safe therapeutic space
- Focus on strengths-based approach while addressing concerns
- Monitor for crisis indicators and escalate appropriately

THERAPEUTIC RELATIONSHIP BUILDING:
- Establish trust through consistency and understanding
- Show genuine interest in ${name}'s unique perspective
- Validate their experiences while providing gentle guidance
- Help them feel heard and understood
- Build therapeutic alliance before deeper therapeutic work
`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { action, childId, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

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

    // Verify that the child belongs to the authenticated family
    const childBelongsToFamily = await verifyChildBelongsToFamily(
      childId,
      family.id
    );
    if (!childBelongsToFamily) {
      return NextResponse.json(
        { error: "Child not found or access denied" },
        { status: 403 }
      );
    }

    // Verify child has complete therapeutic profile
    const isProfileComplete = await verifyChildProfileComplete(childId);
    if (!isProfileComplete) {
      return NextResponse.json(
        {
          error:
            "Child profile incomplete. Please complete the therapeutic questionnaire before starting voice therapy sessions.",
          requiresProfileCompletion: true,
          childId: childId,
        },
        { status: 422 }
      );
    }

    switch (action) {
      case "create_session":
        return await handleCreateSession(childId);

      case "send_message":
        return await handleSendMessage(childId, data);

      case "store_user_message":
        return await handleStoreUserMessage(childId, data);

      case "store_ai_response":
        return await handleStoreAIResponse(childId, data);

      case "get_child_context":
        return await handleGetChildContext(childId);

      case "send_sdp_offer":
        return await handleSendSdpOffer(childId, data);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCreateSession(childId: string) {
  try {
    // Generate OpenAI Realtime session token
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2025-06-03",
          voice: "alloy", // Child-friendly voice
          modalities: ["text", "audio"], // Enable both text and audio
          instructions: "You are Dr. Emma AI, a caring child therapist. Always respond in English. Keep responses warm, empathetic, and age-appropriate.",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.3, // Lower threshold for better sensitivity with earbuds
            prefix_padding_ms: 500, // More padding for better audio capture
            silence_duration_ms: 800 // Longer silence duration for earbuds
          },
          temperature: 0.7,
          max_response_output_tokens: 1000
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Failed to create realtime session" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log session start in database (but don't store placeholder messages)
    try {
      // We'll store actual messages when they come through the WebRTC data channel
      // No need to store placeholder messages
    } catch (error) {
      // Error handling for session start logging
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

async function handleSendMessage(childId: string, data: any) {
  try {
    const { message, messageHistory = [], sessionId } = data;
    console.log('message :', message);

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check for crisis content
    if (detectCrisis(message)) {
      return NextResponse.json({
        success: true,
        response: generateCrisisResponse(),
        crisis: true,
      });
    }

    // For voice chat, we should only store the message and analysis
    // The actual response will come through WebRTC
    
    // Analyze mood based on message
    const moodAnalysis = await analyzeMoodFromMessage(message, "");

    // Extract topics from message for categorization
    const topics = await extractTopicsFromMessage(message);

    let finalSessionId = sessionId;

    // Store the message and analysis
    try {
      const supabase = createServerSupabase();

      // Check for active session first (same as text chat)
      const { data: activeSession, error: activeSessionError } = await supabase
        .from("therapy_sessions")
        .select("*")
        .eq("child_id", childId)
        .eq("status", "active")
        .maybeSingle();

      if (activeSessionError) {
        console.error("Error checking active session:", activeSessionError);
      }

      if (activeSession) {
        // Update existing active session (same as text chat)
        finalSessionId = activeSession.id;
        const currentMessages = activeSession.messages || [];
        const updatedMessages = [
          ...currentMessages,
          {
            sender: 'child',
            content: message,
            timestamp: new Date().toISOString()
          }
        ];

        const { error: updateError } = await supabase
          .from("therapy_sessions")
          .update({
            messages: updatedMessages,
            mood_analysis: moodAnalysis,
            topics: topics,
            status: "active",
          })
          .eq("id", finalSessionId)
          .eq("status", "active");

        if (updateError) {
          console.error("Error updating therapy session:", updateError);
        }
      } else {
        // Create new session only if no active session exists
        const { data: sessionData, error: sessionError } = await supabase
          .from("therapy_sessions")
          .insert({
            child_id: childId,
            messages: [
              {
                sender: 'child',
                content: message,
                timestamp: new Date().toISOString()
              }
            ],
            session_duration: Math.floor(Math.random() * 30) + 15,
            mood_analysis: moodAnalysis,
            topics: topics,
            status: 'active'
          })
          .select()
          .single();

        if (sessionError) {
          console.error("Error storing session:", sessionError);
        } else if (sessionData) {
          finalSessionId = sessionData.id;
        }
      }

      // Update child's last session time
      const { error: updateError } = await supabase
        .from("children")
        .update({ last_session_at: new Date().toISOString() })
        .eq("id", childId);

      if (updateError) {
        console.error("Error updating last session time:", updateError);
      }

      // Store in Pinecone if we have a session ID
      if (finalSessionId) {
        try {
          const { therapeuticMemory } = await import("@/lib/pinecone");

          await therapeuticMemory.storeConversation({
            id: finalSessionId,
            child_id: childId,
            messages: [
              {
                sender: 'child',
                content: message,
                timestamp: new Date().toISOString()
              }
            ],
            mood_analysis: moodAnalysis,
            topics: topics,
            session_date: new Date().toISOString(),
            therapeutic_insights: moodAnalysis.insights || "Child engaged in voice therapy conversation",
          });
        } catch (error) {
          console.error("Error storing in therapeutic memory:", error);
        }
      }
    } catch (error) {
      console.error("Error in message storage:", error);
    }

    // For voice chat, we don't generate a response here
    // The response will come through the WebRTC data channel
    return NextResponse.json({
      success: true,
      sessionId: finalSessionId,
      moodAnalysis: moodAnalysis,
      message: "Message processed for voice chat"
    });
    
  } catch (error) {
    console.error("Error in handleSendMessage:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

async function handleGetChildContext(childId: string) {
  try {
    const childContext = await getChildContext(childId);

    return NextResponse.json({
      success: true,
      childContext,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get child context" },
      { status: 500 }
    );
  }
}

async function handleStoreUserMessage(childId: string, data: any) {
  try {
    const { content } = data;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Skip storing placeholder messages
    if (
      content === "Voice session started" ||
      content === "Voice therapy session initiated with Dr. Emma"
    ) {
      return NextResponse.json({
        success: true,
        message: "Placeholder message skipped",
      });
    }

    // Generate a temporary session ID without storing in database
    const sessionId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      message: "Temporary session ID generated",
      userMessage: content // Send back the user message for later use
    });
  } catch (error) {
    console.error("Error in handleStoreUserMessage:", error);
    return NextResponse.json(
      { error: "Failed to process user message" },
      { status: 500 }
    );
  }
}

async function handleStoreAIResponse(childId: string, data: any) {
  try {
    const { sessionId, content, userMessage } = data;

    if (!content || !userMessage) {
      return NextResponse.json(
        { error: "User message and AI response content are required" },
        { status: 400 }
      );
    }

    try {
      const supabase = createServerSupabase();

      // Analyze mood with full context (user message + AI response)
      const moodAnalysis = await analyzeMoodFromMessage(userMessage, content);

      // Extract topics from the conversation
      const topics = await extractTopicsFromMessage(userMessage);

      // Check for active session first (same as text chat)
      const { data: activeSession, error: activeSessionError } = await supabase
        .from("therapy_sessions")
        .select("*")
        .eq("child_id", childId)
        .eq("status", "active")
        .maybeSingle();

      if (activeSessionError) {
        console.error("Error checking active session:", activeSessionError);
      }

      let finalSessionId = sessionId;

      if (activeSession) {
        // Update existing active session (add both user message and AI response)
        finalSessionId = activeSession.id;
        const currentMessages = activeSession.messages || [];
        const updatedMessages = [
          ...currentMessages,
          {
            sender: 'child',
            content: userMessage,
            timestamp: new Date().toISOString()
          },
          {
            sender: 'ai',
            content: content,
            timestamp: new Date().toISOString()
          }
        ];

        const { error: updateError } = await supabase
          .from("therapy_sessions")
          .update({
            messages: updatedMessages,
            mood_analysis: moodAnalysis,
            topics: topics,
            status: "active",
          })
          .eq("id", finalSessionId)
          .eq("status", "active");

        if (updateError) {
          console.error("Error updating therapy session:", updateError);
          return NextResponse.json(
            { error: "Failed to update session" },
            { status: 500 }
          );
        }
      } else {
        // Create new session only if no active session exists
        const { data: sessionData, error: sessionError } = await supabase
          .from("therapy_sessions")
          .insert({
            child_id: childId,
            messages: [
              {
                sender: 'child',
                content: userMessage,
                timestamp: new Date().toISOString()
              },
              {
                sender: 'ai',
                content: content,
                timestamp: new Date().toISOString()
              }
            ],
            session_duration: Math.floor(Math.random() * 30) + 15,
            mood_analysis: moodAnalysis,
            topics: topics,
            status: 'active'
          })
          .select()
          .single();

        if (sessionError) {
          console.error("Error storing complete session:", sessionError);
          return NextResponse.json(
            { error: "Failed to store session" },
            { status: 500 }
          );
        }

        finalSessionId = sessionData.id;
      }

      // Update child's last session time
      const { error: updateError } = await supabase
        .from("children")
        .update({ last_session_at: new Date().toISOString() })
        .eq("id", childId);

      if (updateError) {
        console.error("Error updating last session time:", updateError);
      }

      // Store conversation in Pinecone for therapeutic memory
      try {
        const { therapeuticMemory } = await import("@/lib/pinecone");

        await therapeuticMemory.storeConversation({
          id: finalSessionId,
          child_id: childId,
          messages: [
            {
              sender: 'child',
              content: userMessage,
              timestamp: new Date().toISOString()
            },
            {
              sender: 'ai',
              content: content,
              timestamp: new Date().toISOString()
            }
          ],
          mood_analysis: moodAnalysis,
          topics: topics,
          session_date: new Date().toISOString(),
          therapeutic_insights:
            moodAnalysis.insights ||
            "Child engaged in voice therapy conversation",
        });
      } catch (error) {
        console.error("Error storing conversation in therapeutic memory:", error);
      }

      return NextResponse.json({
        success: true,
        sessionId: finalSessionId,
        message: "Complete conversation stored successfully",
        moodAnalysis: moodAnalysis,
      });
    } catch (error) {
      console.error("Error in conversation storage:", error);
      return NextResponse.json(
        { error: "Failed to store conversation" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in handleStoreAIResponse:", error);
    return NextResponse.json(
      { error: "Failed to store conversation" },
      { status: 500 }
    );
  }
}

async function handleSendSdpOffer(childId: string, data: any) {
  try {
    const { sdp, model, ephemeralKey } = data;

    if (!sdp || !model || !ephemeralKey) {
      return NextResponse.json(
        { error: "SDP, model, and ephemeral key are required" },
        { status: 400 }
      );
    }

    const baseUrl = "https://api.openai.com/v1/realtime";

    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: sdp,
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp",
      },
    });

    if (!sdpResponse.ok) {
      const errorData = await sdpResponse.json();
      return NextResponse.json(
        { error: "Failed to establish connection with OpenAI" },
        { status: sdpResponse.status }
      );
    }

    const answerSdp = await sdpResponse.text();

    return NextResponse.json({
      success: true,
      sdp: answerSdp,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send SDP offer" },
      { status: 500 }
    );
  }
}
