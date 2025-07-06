import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getAuthenticatedFamilyFromToken,
  createServerSupabase,
} from "@/lib/supabase-auth";
import { therapeuticMemory } from "@/lib/pinecone";
import { embeddedTherapeuticKnowledge } from "@/lib/embedded-therapeutic-knowledge";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone for knowledge base queries
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "dremma";

// Advanced GPT-4.1 Therapeutic AI System for Child Psychology
const SYSTEM_PROMPT = `You are Dr. Emma AI, a highly skilled child and adolescent therapist with specialized training in developmental psychology, trauma-informed care, attachment theory, and evidence-based interventions. You integrate multiple therapeutic modalities including CBT, DBT skills, play therapy, narrative therapy, and somatic approaches.

ADVANCED THERAPEUTIC FRAMEWORK:

DEVELOPMENTAL ATTUNEMENT:
- Automatically adjust language complexity, emotional concepts, and intervention strategies based on developmental stage
- Recognize cognitive and emotional developmental milestones and adjust expectations accordingly
- Use age-appropriate metaphors, examples, and therapeutic tools
- Consider executive functioning capacity when introducing coping strategies
- Integrate play-based and expressive approaches for younger children

TRAUMA-INFORMED THERAPEUTIC APPROACH:
- Assume all children may have experienced some form of stress or trauma
- Prioritize safety, trustworthiness, and collaboration in every interaction
- Recognize trauma responses (fight/flight/freeze/fawn) and respond with regulation support
- Use grounding techniques and co-regulation when dysregulation is detected
- Validate survival responses while gently introducing new coping patterns

ATTACHMENT-BASED INTERVENTIONS:
- Assess attachment patterns through conversation content and emotional responses
- Provide corrective relational experiences through consistent warmth and reliability
- Model secure attachment behaviors (emotional availability, responsiveness, attunement)
- Help children develop internal working models of safety and worthiness
- Support children in developing healthy relationship skills and boundaries

ADVANCED CONVERSATION TECHNIQUES:

EMOTIONAL REGULATION SUPPORT:
- Teach window of tolerance concepts in child-friendly language
- Introduce co-regulation through your calm, consistent presence
- Use breathing techniques, grounding exercises, and mindfulness practices seamlessly
- Help children identify early warning signs of emotional dysregulation
- Practice emotional naming and expansion of emotional vocabulary

COGNITIVE PROCESSING ENHANCEMENT:
- Identify and gently challenge cognitive distortions (catastrophizing, all-or-nothing thinking)
- Use Socratic questioning to help children discover their own insights
- Introduce concept of "thinking traps" and "helpful thoughts"
- Practice perspective-taking and problem-solving skills
- Develop narrative coherence and meaning-making

BEHAVIORAL PATTERN RECOGNITION:
- Notice patterns in emotional triggers, responses, and outcomes
- Help children identify their unique stress signals and coping patterns
- Explore the function of behaviors (what need is the behavior meeting?)
- Introduce behavioral experiments and alternative response strategies
- Track progress and celebrate small improvements

FAMILY SYSTEMS AWARENESS:
- Understand the child within their family context and dynamics
- Recognize family roles, rules, and communication patterns
- Support healthy individuation while maintaining family connections
- Identify family strengths and resources
- Provide psychoeducation about family mental health in age-appropriate ways

ADVANCED INTERVENTION STRATEGIES:

CRISIS RESPONSE PROTOCOL:
- Immediately assess safety (suicidal ideation, self-harm, abuse, severe symptoms)
- Use de-escalation techniques and emotional stabilization
- Activate safety planning and support systems
- Provide clear crisis resources and emergency contacts
- Document concerning content for professional follow-up

THERAPEUTIC SKILL BUILDING:
- Distress tolerance skills (TIPP, grounding, self-soothing)
- Emotional regulation techniques (emotion surfing, opposite action)
- Interpersonal effectiveness (assertiveness, boundary-setting, conflict resolution)
- Mindfulness practices (present moment awareness, acceptance)
- Problem-solving strategies (breaking down problems, generating solutions)

STRENGTH-BASED APPROACH:
- Actively identify and reinforce child's existing strengths and coping abilities
- Use strength-based language and reframing
- Help children recognize their resilience and growth
- Build on natural interests and talents as therapeutic tools
- Foster sense of agency and self-efficacy

ADVANCED ASSESSMENT INTEGRATION:
- Continuously assess mood, anxiety, attention, and behavioral patterns
- Notice changes in functioning across domains (home, school, peers)
- Track therapeutic progress and adjust interventions accordingly
- Identify when higher levels of care may be needed
- Maintain professional boundaries while providing meaningful support

CULTURAL RESPONSIVENESS:
- Be sensitive to cultural background, values, and communication styles
- Recognize cultural concepts of mental health, family, and help-seeking
- Adapt interventions to be culturally relevant and respectful
- Avoid cultural assumptions while being curious about individual differences
- Honor family cultural practices and beliefs in treatment planning

CONVERSATION MASTERY:
- Use advanced reflective listening that captures both content and emotion
- Employ interpretive statements that deepen insight and awareness
- Ask process questions that explore the "how" and "what" of experiences
- Use silence strategically to allow processing and emotional expression
- Employ metaphor, storytelling, and creative expression when appropriate

Remember: You are an expert clinician using GPT-4.1's advanced capabilities to provide sophisticated, individualized therapeutic support. Balance clinical expertise with warmth, authenticity, and age-appropriate engagement. Every interaction should move toward healing, growth, and resilience building.`;

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
      console.error("Error verifying child belongs to family:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in verifyChildBelongsToFamily:", error);
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
      console.error("Error verifying child profile:", error);
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

// Analyze mood based on conversation content
function analyzeMoodFromMessage(userMessage: string, aiResponse: string): any {
  const lowerMessage = userMessage.toLowerCase();

  // Base scores
  let happiness = 5;
  let anxiety = 5;
  let sadness = 5;
  let stress = 5;
  let confidence = 5;

  // Analyze user message for mood indicators

  // Positive indicators
  if (
    lowerMessage.includes("good") ||
    lowerMessage.includes("happy") ||
    lowerMessage.includes("fun") ||
    lowerMessage.includes("playing")
  ) {
    happiness += 2;
    confidence += 1;
  }

  if (
    lowerMessage.includes("calm") ||
    lowerMessage.includes("better") ||
    lowerMessage.includes("relaxed")
  ) {
    anxiety -= 2;
    stress -= 1;
    happiness += 1;
  }

  // Stress indicators
  if (
    lowerMessage.includes("stressed") ||
    lowerMessage.includes("pressure") ||
    lowerMessage.includes("overwhelmed")
  ) {
    stress += 3;
    anxiety += 2;
    happiness -= 1;
  }

  // Anxiety indicators
  if (
    lowerMessage.includes("worried") ||
    lowerMessage.includes("nervous") ||
    lowerMessage.includes("scared")
  ) {
    anxiety += 3;
    confidence -= 2;
  }

  // Frustration/anger indicators (important for children with impulse control issues)
  if (
    lowerMessage.includes("annoying") ||
    lowerMessage.includes("don't want to help") ||
    lowerMessage.includes("not fair")
  ) {
    stress += 2;
    confidence -= 1;
    // This could indicate building frustration that might lead to anger episodes
  }

  // Social issues
  if (
    lowerMessage.includes("friend") &&
    (lowerMessage.includes("problem") || lowerMessage.includes("fight"))
  ) {
    sadness += 2;
    anxiety += 1;
    confidence -= 2;
  }

  // Family conflict indicators
  if (lowerMessage.includes("brother") || lowerMessage.includes("sister")) {
    if (
      lowerMessage.includes("annoying") ||
      lowerMessage.includes("don't") ||
      lowerMessage.includes("won't")
    ) {
      stress += 2;
      // Pattern consistent with family tension issues
    }
  }

  // Ensure scores stay within 1-10 range
  happiness = Math.max(1, Math.min(10, happiness));
  anxiety = Math.max(1, Math.min(10, anxiety));
  sadness = Math.max(1, Math.min(10, sadness));
  stress = Math.max(1, Math.min(10, stress));
  confidence = Math.max(1, Math.min(10, confidence));

  return {
    happiness,
    anxiety,
    sadness,
    stress,
    confidence,
    // Add insights for parents
    insights: generateAdvancedInsights(lowerMessage, {
      happiness,
      anxiety,
      sadness,
      stress,
      confidence,
    }),
  };
}

// Extract topics from a message for categorization
function extractTopicsFromMessage(message: string): string[] {
  if (!message) return ["General conversation"];

  const topics = [];
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("school") ||
    lowerMessage.includes("teacher") ||
    lowerMessage.includes("homework")
  ) {
    topics.push("School stress");
  }
  if (
    lowerMessage.includes("friend") ||
    lowerMessage.includes("social") ||
    lowerMessage.includes("peer")
  ) {
    topics.push("Social relationships");
  }
  if (
    lowerMessage.includes("anxious") ||
    lowerMessage.includes("worried") ||
    lowerMessage.includes("nervous")
  ) {
    topics.push("Anxiety");
  }
  if (
    lowerMessage.includes("family") ||
    lowerMessage.includes("parent") ||
    lowerMessage.includes("sibling") ||
    lowerMessage.includes("brother") ||
    lowerMessage.includes("sister")
  ) {
    topics.push("Family dynamics");
  }
  if (
    lowerMessage.includes("sleep") ||
    lowerMessage.includes("tired") ||
    lowerMessage.includes("insomnia")
  ) {
    topics.push("Sleep issues");
  }
  if (
    lowerMessage.includes("stressed") ||
    lowerMessage.includes("pressure") ||
    lowerMessage.includes("overwhelmed")
  ) {
    topics.push("Stress management");
  }
  if (
    lowerMessage.includes("angry") ||
    lowerMessage.includes("mad") ||
    lowerMessage.includes("annoying")
  ) {
    topics.push("Anger management");
  }
  if (
    lowerMessage.includes("bullying") ||
    lowerMessage.includes("bully") ||
    lowerMessage.includes("mean")
  ) {
    topics.push("Bullying concerns");
  }
  if (
    lowerMessage.includes("calm") ||
    lowerMessage.includes("breathing") ||
    lowerMessage.includes("relax")
  ) {
    topics.push("Coping strategies");
  }

  return topics.length > 0 ? topics : ["General conversation"];
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
      "ANXIETY SYMPTOMS: Clinical-level anxiety detected - consider professional assessment"
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
    comprehensiveInsight += "CLINICAL OBSERVATIONS: " + insights.join(" | ");
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
      // Return a basic context if child not found
      return `
CHILD PROFILE FOR DR. EMMA AI:
- This is a child or teenager seeking emotional support
- Provide general age-appropriate therapy and emotional validation
- Focus on building trust and providing a safe space to talk
`;
    }

    // Use the comprehensive child context generation
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
- Build critical thinking about emotions and relationships`
    : `- Treat as emerging adult with respect for autonomy
- Support transition to adulthood planning
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

// Get child data for knowledge base enhancement
async function getChildDataForKnowledge(
  childId: string
): Promise<{ age?: number; concerns?: string[] } | null> {
  try {
    const supabase = createServerSupabase();
    const { data: child, error } = await supabase
      .from("children")
      .select("age, current_concerns")
      .eq("id", childId)
      .single();

    if (error || !child) {
      console.error("Error fetching child data for knowledge base:", error);
      return null;
    }

    return {
      age: child.age,
      concerns: child.current_concerns
        ? child.current_concerns.split(",").map((c: string) => c.trim())
        : undefined,
    };
  } catch (error) {
    console.error("Error in getChildDataForKnowledge:", error);
    return null;
  }
}

// Get child-specific knowledge base documents from Pinecone
async function getChildKnowledgeBaseContext(
  childId: string,
  currentMessage: string
): Promise<string> {
  try {
    const index = pinecone.index(INDEX_NAME);

    // Create embedding for the current message to find relevant knowledge base documents
    const queryEmbedding = await createEmbedding(currentMessage);

    // Search for knowledge base documents specific to this child
    const results = await index.query({
      vector: queryEmbedding,
      topK: 3, // Get top 3 most relevant documents
      filter: {
        child_id: { $eq: childId },
        type: { $eq: "knowledge_base_document" },
      },
      includeMetadata: true,
    });

    if (!results.matches || results.matches.length === 0) {
      console.log("📚 No child-specific knowledge base documents found");
      return "";
    }

    let knowledgeContext = "CHILD-SPECIFIC KNOWLEDGE BASE CONTEXT:\n\n";

    results.matches.forEach((match, index) => {
      const metadata = match.metadata;
      const filename = metadata?.filename || "Unknown document";
      const contentPreview = metadata?.content_preview || "";
      const similarity = match.score || 0;

      knowledgeContext += `${index + 1}. Document: ${filename} (Relevance: ${(
        similarity * 100
      ).toFixed(1)}%)\n`;
      knowledgeContext += `   Content: ${contentPreview}\n\n`;
    });

    console.log(
      `📚 Found ${results.matches.length} relevant knowledge base documents for child ${childId}`
    );
    return knowledgeContext;
  } catch (error) {
    console.error("Error querying child knowledge base:", error);
    return "";
  }
}

// Create embedding for text content (reused from upload route)
async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text.substring(0, 8000), // Limit input length
      dimensions: 2048, // Explicitly set to match Pinecone index
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw new Error("Failed to create embedding");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, childId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
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

    // Crisis detection
    if (detectCrisis(message)) {
      console.log("🚨 CRISIS DETECTED - Message:", message.substring(0, 100));

      // Log crisis for immediate parent notification (implement this)
      // await notifyParentOfCrisis(message)

      return NextResponse.json({
        response: generateCrisisResponse(),
        crisis: true,
      });
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

    // Verify child has complete therapeutic profile before allowing chat
    const isProfileComplete = await verifyChildProfileComplete(childId);
    if (!isProfileComplete) {
      return NextResponse.json(
        {
          error:
            "Child profile incomplete. Please complete the therapeutic questionnaire before starting therapy sessions.",
          requiresProfileCompletion: true,
          childId: childId,
        },
        { status: 422 }
      );
    }

    const childContext = await getChildContext(childId);

    // Get therapeutic memory context from Pinecone
    let therapeuticContext = "";
    try {
      therapeuticContext = await therapeuticMemory.generateTherapeuticContext(
        childId,
        message
      );
      if (therapeuticContext && therapeuticContext.length > 50) {
        console.log("✅ Using therapeutic memory context from Pinecone");
      }
    } catch (error) {
      console.error("Error accessing therapeutic memory:", error);
      therapeuticContext =
        "THERAPEUTIC MODE: Using child-specific background without historical memory context.";
    }

    // Get child-specific knowledge base documents from Pinecone
    let childKnowledgeContext = "";
    try {
      childKnowledgeContext = await getChildKnowledgeBaseContext(
        childId,
        message
      );
      if (childKnowledgeContext && childKnowledgeContext.length > 50) {
        console.log("📚 Using child-specific knowledge base documents");
      }
    } catch (error) {
      console.error("Error accessing child knowledge base:", error);
      childKnowledgeContext = "";
    }

    // Get child data for enhanced knowledge base context
    const childData = await getChildDataForKnowledge(childId);

    // Get embedded therapeutic guidance automatically integrated into AI
    let knowledgeGuidance = "";
    try {
      // Ensure knowledge base is loaded
      await embeddedTherapeuticKnowledge.loadKnowledgeBase();

      // Get therapeutic context for this specific interaction
      knowledgeGuidance = embeddedTherapeuticKnowledge.getTherapeuticContext(
        childData?.age,
        childData?.concerns || extractTopicsFromMessage(message),
        message
      );
      if (knowledgeGuidance && knowledgeGuidance.length > 50) {
        console.log("🧠 Using embedded therapeutic knowledge base");
      }
    } catch (error) {
      console.error("Error accessing embedded therapeutic knowledge:", error);
    }

    // Create personalized system prompt with child's background, therapeutic memory, and knowledge base
    const personalizedSystemPrompt = `${SYSTEM_PROMPT}

CHILD-SPECIFIC CONTEXT:
${childContext}

${therapeuticContext}

${childKnowledgeContext}

${knowledgeGuidance}

CRITICAL INSTRUCTION: If knowledge base documents are provided above, you MUST reference and use the specific techniques, exercises, and strategies from those documents in your response. Do not make up new techniques - use the ones provided in the knowledge base context.

IMPORTANT: Use the child's actual name from the CHILD-SPECIFIC CONTEXT above in your responses when appropriate. Do not use any other names.

THERAPEUTIC FOCUS FOR THIS CHILD:
- PROACTIVELY check in about family dynamics and sibling relationships
- Ask gentle questions about school situations and friendships
- Guide conversations toward emotional awareness before anger builds up
- When child shows frustration, explore the feelings underneath
- Normalize their big feelings while teaching regulation techniques
- Help them identify their triggers in a developmentally appropriate way
- Practice coping strategies through natural conversation (breathing, counting, etc.)
- Build self-esteem and confidence around their strengths

SESSION LEADERSHIP FOR THIS CHILD:
- Start with a warm, personalized greeting using the child's name from the context
- Check in about recent experiences: "What's been happening with your family lately?"
- Notice emotional cues: "I can tell you might be feeling frustrated about that..."
- Guide toward insight: "What do you think was going on inside when that happened?"
- Teach through experience: "Let's try something that might help when you feel that way..."

PARENT GOALS TO WORK TOWARD:
- Document behavioral patterns and emotional triggers for professional consultation
- Help the child develop emotional vocabulary and self-awareness
- Build practical coping skills they can use independently
- Strengthen family communication and understanding

Use this information to provide personalized, contextual therapy responses that address this specific child's needs, concerns, and background.`;

    // Build conversation context
    const conversationHistory =
      history?.slice(-8).map((msg: any) => ({
        role: msg.sender === "child" ? "user" : "assistant",
        content: msg.content,
      })) || [];

    const messages = [
      { role: "system", content: personalizedSystemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    // Get AI response from OpenAI with GPT-4.1 for enhanced therapeutic capabilities
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    // Analyze mood based on conversation content
    const moodAnalysis = analyzeMoodFromMessage(message, aiResponse);

    // Save therapy session to database
    let sessionId = "";
    try {
      const supabase = createServerSupabase();
      const { data: sessionData, error: sessionError } = await supabase
        .from("therapy_sessions")
        .insert({
          child_id: childId,
          user_message: message,
          ai_response: aiResponse,
          session_duration: Math.floor(Math.random() * 30) + 15, // Simulated duration 15-45 min
          mood_analysis: moodAnalysis,
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Error saving therapy session:", sessionError);
      } else if (sessionData) {
        sessionId = sessionData.id;
      }

      // Update child's last session time
      await supabase
        .from("children")
        .update({ last_session_at: new Date().toISOString() })
        .eq("id", childId);
    } catch (error) {
      console.error("Error logging session:", error);
    }

    // Store conversation in Pinecone for therapeutic memory
    try {
      if (sessionId) {
        await therapeuticMemory.storeConversation({
          id: sessionId,
          child_id: childId,
          user_message: message,
          ai_response: aiResponse,
          mood_analysis: moodAnalysis,
          topics: extractTopicsFromMessage(message),
          session_date: new Date().toISOString(),
          therapeutic_insights:
            moodAnalysis.insights ||
            "Child engaged in therapeutic conversation",
        });
        console.log("✅ Conversation stored in therapeutic memory");
      }
    } catch (error) {
      console.error("Error storing in therapeutic memory:", error);
    }

    // Log conversation for analysis
    console.log("💬 Child Message:", message.substring(0, 100));
    console.log("🤖 AI Response:", aiResponse.substring(0, 100));
    console.log("👶 Child ID:", childId);

    return NextResponse.json({
      response: aiResponse,
      crisis: false,
    });
  } catch (error) {
    console.error("Error in chat API:", error);

    // Fallback to anxiety-supportive responses
    const anxietyResponses = [
      "I can hear that you're going through something difficult right now. It's okay to feel overwhelmed sometimes - that's completely normal. Can you tell me a little more about what's been on your mind? 💜",

      "Thank you for sharing that with me. It sounds like you're dealing with some big feelings, and that can be really hard. You're being so brave by talking about it. What's one small thing that usually helps you feel a tiny bit better?",

      "I understand this feels really tough right now. Sometimes when we're worried or stressed, it can feel like everything is too much. Let's take a moment together - can you take three slow, deep breaths with me?",

      "It's really important that you shared this with me. Your feelings matter, and you deserve support. While I'm here to listen, I also want to make sure you have other people in your life who can help. Is there a trusted adult you feel comfortable talking to?",
    ];

    const fallbackResponse =
      anxietyResponses[Math.floor(Math.random() * anxietyResponses.length)];

    return NextResponse.json({
      response: fallbackResponse,
      crisis: false,
      fallback: true,
    });
  }
}
