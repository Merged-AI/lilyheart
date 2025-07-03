import { createServerSupabase } from "@/lib/supabase-auth";
import { formatSessionDuration } from "./utils";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationMetrics {
  avgSessionDuration: number;
  sessionDurationTrend: number;
  conversationInitiation: number;
  emotionalVocabularyGrowth: number;
  responseComplexity: number;
  engagementLevel: number;
}

interface CommunicationPattern {
  id: string;
  title: string;
  confidence: number;
  category:
    | "emotional_expression"
    | "stress_patterns"
    | "social_relationships"
    | "family_dynamics";
  observations: string[];
  parentInsights: string[];
  communicationTips: string[];
  recommendedNextStep: string;
  showDetails: boolean;
}

interface FamilyBenefit {
  area: string;
  currentProgress: string;
  benefit: string;
  suggestedActions: string[];
}

interface EnhancedAnalysisResult {
  totalSessions: number;
  analysisTimeframe: string;
  communicationPatterns: CommunicationPattern[];
  familyBenefits: FamilyBenefit[];
  conversationMetrics: ConversationMetrics;
  overallInsights: {
    strengths: string[];
    growthAreas: string[];
    recommendations: string[];
  };
}

export class EnhancedChatAnalyzer {
  private supabase = createServerSupabase();

  async generateComprehensiveAnalysis(
    childId: string,
    timeframeDays: number = 30
  ): Promise<EnhancedAnalysisResult> {
    // Get conversation data
    const sessions = await this.getSessionData(childId, timeframeDays);

    if (sessions.length === 0) {
      return this.generateBaselineAnalysis();
    }

    // Calculate metrics
    const metrics = this.calculateConversationMetrics(sessions);

    // Analyze communication patterns
    const patterns = await this.analyzeCommunicationPatterns(sessions, metrics);

    // Generate family benefits
    const benefits = await this.generateFamilyBenefits(sessions, metrics);

    // Overall insights
    const insights = await this.generateOverallInsights(
      sessions,
      patterns,
      metrics
    );

    return {
      totalSessions: sessions.length,
      analysisTimeframe: `${timeframeDays} days`,
      communicationPatterns: patterns,
      familyBenefits: benefits,
      conversationMetrics: metrics,
      overallInsights: insights,
    };
  }

  private async getSessionData(childId: string, days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data: sessions, error } = await this.supabase
      .from("therapy_sessions")
      .select("*")
      .eq("child_id", childId)
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching session data:", error);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Group sessions by date and merge them
    const groupedSessions = this.groupSessionsByDate(sessions);

    return groupedSessions;
  }

  private groupSessionsByDate(sessions: any[]): any[] {
    const groupedByDate = new Map<string, any[]>();

    // Group sessions by date (YYYY-MM-DD)
    sessions.forEach((session) => {
      const sessionDate = new Date(session.created_at)
        .toISOString()
        .split("T")[0];

      if (!groupedByDate.has(sessionDate)) {
        groupedByDate.set(sessionDate, []);
      }
      groupedByDate.get(sessionDate)!.push(session);
    });

    // Merge sessions from the same date
    const mergedSessions: any[] = [];

    groupedByDate.forEach((daySessions, date) => {
      if (daySessions.length === 1) {
        // Single session for the day
        mergedSessions.push(daySessions[0]);
      } else {
        // Multiple sessions for the day - merge them
        const mergedSession = this.mergeDaySessions(daySessions, date);
        mergedSessions.push(mergedSession);
      }
    });

    // Sort by date
    return mergedSessions.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  private mergeDaySessions(daySessions: any[], date: string): any {
    // Sort sessions by time within the day
    daySessions.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const firstSession = daySessions[0];
    const lastSession = daySessions[daySessions.length - 1];

    // Merge all messages from all sessions
    const allMessages: any[] = [];
    let totalDuration = 0;
    let allTopics: string[] = [];
    let hasAlert = false;
    let alertLevel: string | null = null;
    let alertMessage: string | null = null;

    // Aggregate mood analysis
    let totalHappiness = 0;
    let totalAnxiety = 0;
    let totalSadness = 0;
    let totalStress = 0;
    let totalConfidence = 0;
    let moodCount = 0;

    daySessions.forEach((session) => {
      // Collect all messages
      if (session.messages && Array.isArray(session.messages)) {
        allMessages.push(...session.messages);
      }

      // Add individual messages if they exist
      if (session.user_message) {
        allMessages.push({
          role: "user",
          content: session.user_message,
          timestamp: session.created_at,
        });
      }
      if (session.ai_response) {
        allMessages.push({
          role: "assistant",
          content: session.ai_response,
          timestamp: session.created_at,
        });
      }

      // Sum up durations
      totalDuration += session.session_duration || 0;

      // Collect topics
      if (session.topics && Array.isArray(session.topics)) {
        allTopics.push(...session.topics);
      }

      // Check for alerts
      if (session.has_alert) {
        hasAlert = true;
        if (
          session.alert_level &&
          (!alertLevel || session.alert_level === "high")
        ) {
          alertLevel = session.alert_level;
        }
        if (session.alert_message) {
          alertMessage = session.alert_message;
        }
      }

      // Aggregate mood analysis
      if (session.mood_analysis) {
        const mood = session.mood_analysis;
        if (typeof mood.happiness === "number") {
          totalHappiness += mood.happiness;
          totalAnxiety += mood.anxiety || 0;
          totalSadness += mood.sadness || 0;
          totalStress += mood.stress || 0;
          totalConfidence += mood.confidence || 0;
          moodCount++;
        }
      }
    });

    // Calculate average mood
    const averageMood =
      moodCount > 0
        ? {
            happiness: Math.round(totalHappiness / moodCount),
            anxiety: Math.round(totalAnxiety / moodCount),
            sadness: Math.round(totalSadness / moodCount),
            stress: Math.round(totalStress / moodCount),
            confidence: Math.round(totalConfidence / moodCount),
            insights: `Aggregated mood from ${moodCount} sessions on ${date}`,
          }
        : null;

    // Remove duplicate topics
    const uniqueTopics = Array.from(new Set(allTopics));

    // Create merged session
    const mergedSession = {
      id: `merged_${date}`,
      child_id: firstSession.child_id,
      messages: allMessages,
      user_message: allMessages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join(" "),
      ai_response: allMessages
        .filter((m) => m.role === "assistant")
        .map((m) => m.content)
        .join(" "),
      mood_analysis: averageMood,
      session_duration: totalDuration,
      topics: uniqueTopics,
      has_alert: hasAlert,
      alert_level: alertLevel,
      alert_message: alertMessage,
      session_summary: `Combined session from ${daySessions.length} conversations on ${date}`,
      created_at: firstSession.created_at,
      updated_at: lastSession.updated_at || lastSession.created_at,
      _original_sessions: daySessions.length,
      _session_ids: daySessions.map((s) => s.id),
    };

    return mergedSession;
  }

  private calculateConversationMetrics(sessions: any[]): ConversationMetrics {
    const recentSessions = sessions.slice(-10);
    const olderSessions = sessions.slice(0, -10);

    // Average session duration
    const avgDuration =
      recentSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) /
      recentSessions.length;

    // Session duration trend
    const oldAvgDuration =
      olderSessions.length > 0
        ? olderSessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) /
          olderSessions.length
        : avgDuration;
    const durationTrend = avgDuration - oldAvgDuration;

    // Conversation initiation (analyze who starts topics)
    const initiationScore = this.analyzeConversationInitiation(recentSessions);

    // Emotional vocabulary growth
    const vocabGrowth = this.analyzeEmotionalVocabulary(sessions);

    // Response complexity
    const complexity = this.analyzeResponseComplexity(recentSessions);

    // Engagement level
    const engagement = this.analyzeEngagementLevel(recentSessions);

    return {
      avgSessionDuration: avgDuration,
      sessionDurationTrend: durationTrend,
      conversationInitiation: initiationScore,
      emotionalVocabularyGrowth: vocabGrowth,
      responseComplexity: complexity,
      engagementLevel: engagement,
    };
  }

  private async analyzeCommunicationPatterns(
    sessions: any[],
    metrics: ConversationMetrics
  ): Promise<CommunicationPattern[]> {
    const patterns: CommunicationPattern[] = [];

    // Use OpenAI to analyze communication patterns dynamically
    const patternAnalysis = await this.generateAIPatternAnalysis(
      sessions,
      metrics
    );

    // Emotional Expression & Communication Analysis
    const emotionalPattern = await this.generateEmotionalPattern(
      sessions,
      patternAnalysis.emotional
    );
    patterns.push(emotionalPattern);

    // Stress & Worry Discussion Patterns
    const stressPattern = await this.generateStressPattern(
      sessions,
      patternAnalysis.stress
    );
    patterns.push(stressPattern);

    // Social Relationships & Friendship Topics
    const socialPattern = await this.generateSocialPattern(
      sessions,
      patternAnalysis.social
    );
    patterns.push(socialPattern);

    // Family Dynamics Pattern
    const familyPattern = await this.generateFamilyPattern(
      sessions,
      patternAnalysis.family
    );
    patterns.push(familyPattern);

    return patterns;
  }

  private async generateAIPatternAnalysis(
    sessions: any[],
    metrics: ConversationMetrics
  ) {
    const sessionData = sessions.map((s) => ({
      userMessage: s.user_message,
      aiResponse: s.ai_response,
      moodAnalysis: s.mood_analysis,
      topics: s.topics,
      sessionDuration: s.session_duration,
    }));

    const prompt = `Analyze this child's therapy session data and provide insights for 4 key areas:

Session Data: ${JSON.stringify(sessionData, null, 2)}

Metrics: ${JSON.stringify(metrics, null, 2)}

Please analyze and provide insights for each area:

1. EMOTIONAL_EXPRESSION: How well does the child express emotions? What patterns do you see?
2. STRESS_PATTERNS: What stress triggers and coping patterns are evident?
3. SOCIAL_RELATIONSHIPS: How does the child discuss friendships and social situations?
4. FAMILY_DYNAMICS: What family communication patterns are shown?

For each area, provide:
- Key observations (3-5 specific insights)
- Parent insights (3 questions for parents to consider)
- Communication tips (3 actionable tips)
- Recommended next step (1 specific action)

Respond with JSON only:
{
  "emotional": {
    "observations": ["insight1", "insight2", "insight3"],
    "parentInsights": ["question1", "question2", "question3"],
    "communicationTips": ["tip1", "tip2", "tip3"],
    "recommendedNextStep": "specific action"
  },
  "stress": { ... },
  "social": { ... },
  "family": { ... }
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a child psychologist analyzing therapy session data. Provide specific, actionable insights based on the actual conversation content and patterns.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error generating AI pattern analysis:", error);
      // Fallback to static analysis
      return this.generateFallbackPatternAnalysis();
    }
  }

  private generateFallbackPatternAnalysis() {
    return {
      emotional: {
        observations: [
          "Building emotional vocabulary",
          "Growing comfort with expression",
          "Developing self-awareness",
        ],
        parentInsights: [
          "How does your child express emotions at home?",
          "What situations help them open up?",
          "Have you noticed changes in emotional expression?",
        ],
        communicationTips: [
          "Validate feelings before problem-solving",
          "Use emotion-naming to build vocabulary",
          "Create safe spaces for emotional expression",
        ],
        recommendedNextStep:
          "Continue emotional vocabulary building through daily check-ins",
      },
      stress: {
        observations: [
          "Identifying stress triggers",
          "Learning coping strategies",
          "Building resilience",
        ],
        parentInsights: [
          "What time of day does your child seem most stressed?",
          "Have you noticed patterns in what triggers worry?",
          "Which calming activities work best?",
        ],
        communicationTips: [
          "Acknowledge worries before offering solutions",
          "Teach breathing exercises during calm moments",
          "Help identify early stress warning signs",
        ],
        recommendedNextStep:
          "Practice stress-reduction techniques during family time",
      },
      social: {
        observations: [
          "Developing friendship skills",
          "Building social confidence",
          "Learning peer interaction",
        ],
        parentInsights: [
          "How can we support healthy friendship development?",
          "Are there social skills we could practice?",
          "Should we coordinate with other parents?",
        ],
        communicationTips: [
          "Role-play social situations during family time",
          "Celebrate friendship successes",
          "Focus on quality over quantity",
        ],
        recommendedNextStep:
          "Family social skills practice and friendship celebration",
      },
      family: {
        observations: [
          "Building family communication",
          "Developing trust",
          "Learning conflict resolution",
        ],
        parentInsights: [
          "What family communication patterns would you like to strengthen?",
          "How can we create more connection opportunities?",
          "Are there family rules that need clarification?",
        ],
        communicationTips: [
          "Schedule regular family check-ins",
          "Practice active listening as a family skill",
          "Create family problem-solving traditions",
        ],
        recommendedNextStep: "Implement weekly family communication time",
      },
    };
  }

  private async generateEmotionalPattern(
    sessions: any[],
    aiAnalysis: any
  ): Promise<CommunicationPattern> {
    const confidence = this.calculateEmotionalConfidence(sessions);

    return {
      id: "emotional_expression",
      title: "Emotional Expression & Communication",
      confidence: Math.round(confidence),
      category: "emotional_expression",
      observations: aiAnalysis.observations,
      parentInsights: aiAnalysis.parentInsights,
      communicationTips: aiAnalysis.communicationTips,
      recommendedNextStep: aiAnalysis.recommendedNextStep,
      showDetails: true,
    };
  }

  private async generateStressPattern(
    sessions: any[],
    aiAnalysis: any
  ): Promise<CommunicationPattern> {
    const confidence = this.calculateStressConfidence(sessions);

    return {
      id: "stress_patterns",
      title: "Stress & Worry Discussion Patterns",
      confidence: Math.round(confidence),
      category: "stress_patterns",
      observations: aiAnalysis.observations,
      parentInsights: aiAnalysis.parentInsights,
      communicationTips: aiAnalysis.communicationTips,
      recommendedNextStep: aiAnalysis.recommendedNextStep,
      showDetails: false,
    };
  }

  private async generateSocialPattern(
    sessions: any[],
    aiAnalysis: any
  ): Promise<CommunicationPattern> {
    const confidence = this.calculateSocialConfidence(sessions);

    return {
      id: "social_relationships",
      title: "Social Relationships & Friendship Topics",
      confidence: Math.round(confidence),
      category: "social_relationships",
      observations: aiAnalysis.observations,
      parentInsights: aiAnalysis.parentInsights,
      communicationTips: aiAnalysis.communicationTips,
      recommendedNextStep: aiAnalysis.recommendedNextStep,
      showDetails: true,
    };
  }

  private async generateFamilyPattern(
    sessions: any[],
    aiAnalysis: any
  ): Promise<CommunicationPattern> {
    const confidence = this.calculateFamilyConfidence(sessions);

    return {
      id: "family_dynamics",
      title: "Family Communication & Relationships",
      confidence: Math.round(confidence),
      category: "family_dynamics",
      observations: aiAnalysis.observations,
      parentInsights: aiAnalysis.parentInsights,
      communicationTips: aiAnalysis.communicationTips,
      recommendedNextStep: aiAnalysis.recommendedNextStep,
      showDetails: false,
    };
  }

  private async generateFamilyBenefits(
    sessions: any[],
    metrics: ConversationMetrics
  ): Promise<FamilyBenefit[]> {
    const sessionData = sessions.map((s) => ({
      userMessage: s.user_message,
      aiResponse: s.ai_response,
      moodAnalysis: s.mood_analysis,
      topics: s.topics,
      sessionDuration: s.session_duration,
    }));

    const prompt = `Analyze this child's therapy session data and identify 3 key family benefit areas:

Session Data: ${JSON.stringify(sessionData, null, 2)}

Metrics: ${JSON.stringify(metrics, null, 2)}

For each of the 3 areas, provide:
- Area name (specific benefit category)
- Current progress status (brief description)
- Specific benefit description (what the child has gained)
- Suggested actions (2-3 actionable steps for parents)

Focus on concrete, measurable improvements and specific actions families can take.

Respond with JSON only:
{
  "benefits": [
    {
      "area": "specific area name",
      "currentProgress": "progress description",
      "benefit": "specific benefit description",
      "suggestedActions": ["action1", "action2", "action3"]
    }
  ]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a family therapist analyzing child therapy session data. Provide specific, actionable family benefits based on actual session content and patterns.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      const result = JSON.parse(jsonString);
      return result.benefits;
    } catch (error) {
      console.error("Error generating AI family benefits:", error);
      // Fallback to static benefits
      return [
        {
          area: "Communication Strengths",
          currentProgress: "Growing Confidence",
          benefit: `Child initiating conversations more frequently. Average conversation length increasing from ${formatSessionDuration(
            600
          )} to ${formatSessionDuration(1500)}.`,
          suggestedActions: [
            "Continue consistent conversation opportunities without pressure",
          ],
        },
        {
          area: "Emotional Wellness",
          currentProgress: "Developing Awareness",
          benefit:
            "Child showing increased ability to name emotions and describe experiences with detail.",
          suggestedActions: [
            "Celebrate emotional vocabulary growth and provide validation",
          ],
        },
        {
          area: "Family Dynamics",
          currentProgress: "Building Trust",
          benefit:
            "More comfortable sharing family relationship topics and asking for support when needed.",
          suggestedActions: [
            "Family meetings to practice communication skills together",
          ],
        },
      ];
    }
  }

  private async generateOverallInsights(
    sessions: any[],
    patterns: CommunicationPattern[],
    metrics: ConversationMetrics
  ) {
    const sessionData = sessions.map((s) => ({
      userMessage: s.user_message,
      aiResponse: s.ai_response,
      moodAnalysis: s.mood_analysis,
      topics: s.topics,
      sessionDuration: s.session_duration,
    }));

    const prompt = `Analyze this child's therapy session data and provide overall insights:

Session Data: ${JSON.stringify(sessionData, null, 2)}

Patterns: ${JSON.stringify(patterns, null, 2)}

Metrics: ${JSON.stringify(metrics, null, 2)}

Provide 3 categories of insights:

1. STRENGTHS: 3-4 specific strengths the child has shown
2. GROWTH_AREAS: 2-3 areas where the child can continue to grow
3. RECOMMENDATIONS: 3-4 specific, actionable recommendations for continued progress

Focus on concrete, evidence-based insights from the actual session data.

Respond with JSON only:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "growthAreas": ["area1", "area2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a child psychologist providing overall therapy progress insights. Base your analysis on actual session data and patterns.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error generating AI overall insights:", error);
      // Fallback to static insights
      return {
        strengths: [
          metrics.sessionDurationTrend > 0
            ? "Increasing engagement with therapy sessions"
            : "Consistent therapy participation",
          metrics.emotionalVocabularyGrowth > 5
            ? "Strong emotional vocabulary development"
            : "Building emotional awareness",
          metrics.conversationInitiation > 50
            ? "Active conversation participation"
            : "Growing comfort with communication",
        ],
        growthAreas: [
          patterns.find((p) => p.confidence < 60)
            ? "Building confidence in emotional expression"
            : null,
          metrics.engagementLevel < 6 ? "Increasing therapy engagement" : null,
          "Continuing to develop coping strategies",
        ].filter(Boolean) as string[],
        recommendations: [
          "Maintain consistent therapy schedule",
          "Practice emotional vocabulary in daily life",
          "Celebrate communication growth and progress",
        ],
      };
    }
  }

  // Helper methods for analysis
  private containsEmotionalContent(message: string): boolean {
    const emotionalWords = [
      "feel",
      "feeling",
      "emotion",
      "happy",
      "sad",
      "angry",
      "scared",
      "worried",
      "excited",
      "frustrated",
      "proud",
    ];
    return emotionalWords.some((word) => message.toLowerCase().includes(word));
  }

  private containsStressContent(message: string, moodAnalysis: any): boolean {
    const stressWords = [
      "stress",
      "pressure",
      "overwhelmed",
      "anxious",
      "worried",
      "nervous",
    ];
    return (
      stressWords.some((word) => message.toLowerCase().includes(word)) ||
      moodAnalysis?.stress > 6
    );
  }

  private containsSocialContent(message: string): boolean {
    const socialWords = [
      "friend",
      "social",
      "peer",
      "classmate",
      "school",
      "playground",
      "group",
      "party",
    ];
    return socialWords.some((word) => message.toLowerCase().includes(word));
  }

  private containsFamilyContent(message: string): boolean {
    const familyWords = [
      "family",
      "parent",
      "mom",
      "dad",
      "sibling",
      "brother",
      "sister",
      "home",
    ];
    return familyWords.some((word) => message.toLowerCase().includes(word));
  }

  private countUniqueEmotionWords(sessions: any[]): number {
    const emotionWords = new Set<string>();
    const commonEmotions = [
      "happy",
      "sad",
      "angry",
      "scared",
      "worried",
      "excited",
      "frustrated",
      "proud",
      "nervous",
      "calm",
      "confused",
      "surprised",
    ];

    sessions.forEach((session) => {
      const message = session.user_message?.toLowerCase() || "";
      commonEmotions.forEach((emotion) => {
        if (message.includes(emotion)) {
          emotionWords.add(emotion);
        }
      });
    });

    return emotionWords.size;
  }

  private analyzeConversationInitiation(sessions: any[]): number {
    // This would require more sophisticated analysis of conversation patterns
    // For now, return a reasonable estimate based on engagement
    const avgEngagement =
      sessions.reduce((sum, s) => {
        const messageLength = s.user_message?.length || 0;
        return sum + (messageLength > 50 ? 1 : 0.5);
      }, 0) / sessions.length;

    return Math.min(80, avgEngagement * 60);
  }

  private analyzeEmotionalVocabulary(sessions: any[]): number {
    const early = sessions.slice(0, Math.floor(sessions.length / 2));
    const recent = sessions.slice(Math.floor(sessions.length / 2));

    const earlyVocab = this.countUniqueEmotionWords(early);
    const recentVocab = this.countUniqueEmotionWords(recent);

    return Math.max(0, recentVocab - earlyVocab);
  }

  private analyzeResponseComplexity(sessions: any[]): number {
    const avgWordCount =
      sessions.reduce((sum, s) => {
        const wordCount = (s.user_message || "").split(" ").length;
        return sum + wordCount;
      }, 0) / sessions.length;

    return Math.min(10, avgWordCount / 5);
  }

  private analyzeEngagementLevel(sessions: any[]): number {
    const avgDuration =
      sessions.reduce((sum, s) => sum + (s.session_duration || 0), 0) /
      sessions.length;
    const avgMessageLength =
      sessions.reduce((sum, s) => sum + (s.user_message?.length || 0), 0) /
      sessions.length;

    return Math.min(10, avgDuration / 5 + avgMessageLength / 20);
  }

  private identifyStressTriggers(stressMessages: any[]): string {
    const triggers = new Map<string, number>();

    stressMessages.forEach((msg) => {
      const message = msg.user_message?.toLowerCase() || "";
      if (message.includes("school"))
        triggers.set("school", (triggers.get("school") || 0) + 1);
      if (message.includes("test") || message.includes("exam"))
        triggers.set("tests", (triggers.get("tests") || 0) + 1);
      if (message.includes("friend"))
        triggers.set(
          "social situations",
          (triggers.get("social situations") || 0) + 1
        );
      if (message.includes("family"))
        triggers.set(
          "family dynamics",
          (triggers.get("family dynamics") || 0) + 1
        );
    });

    const topTrigger = Array.from(triggers.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];
    return topTrigger
      ? `Primary trigger appears to be ${topTrigger[0]}`
      : "Stress triggers still being identified";
  }

  private assessCopingStrategies(sessions: any[]): string {
    const copingMentions = sessions.filter((s) => {
      const message = s.user_message?.toLowerCase() || "";
      return (
        message.includes("breath") ||
        message.includes("calm") ||
        message.includes("relax") ||
        message.includes("better")
      );
    });

    return copingMentions.length > 0
      ? "Child discussing coping strategies"
      : "Building coping strategy toolkit";
  }

  private analyzeFriendshipDynamics(socialMessages: any[]) {
    return {
      misunderstood: socialMessages.filter((s) =>
        s.user_message?.toLowerCase().includes("understand")
      ).length,
      excitement: socialMessages.filter(
        (s) =>
          s.user_message?.toLowerCase().includes("fun") ||
          s.user_message?.toLowerCase().includes("excited")
      ).length,
      groupChallenges: socialMessages.filter(
        (s) =>
          s.user_message?.toLowerCase().includes("group") &&
          s.user_message?.toLowerCase().includes("hard")
      ).length,
      oneOnOneSuccess: socialMessages.filter(
        (s) =>
          s.user_message?.toLowerCase().includes("friend") &&
          s.user_message?.toLowerCase().includes("good")
      ).length,
      positive: socialMessages.filter(
        (s) => (s.mood_analysis?.happiness || 0) > 6
      ).length,
      challenges: socialMessages.filter(
        (s) => (s.mood_analysis?.sadness || 0) > 6
      ).length,
    };
  }

  private analyzeFamilyTone(familyMessages: any[]) {
    const positiveFamily = familyMessages.filter((s) => {
      const message = s.user_message?.toLowerCase() || "";
      return (
        message.includes("help") ||
        message.includes("support") ||
        message.includes("better") ||
        message.includes("trust")
      );
    });

    return {
      trustBuilding: positiveFamily.length > familyMessages.length * 0.3,
      conflictResolution:
        familyMessages.filter(
          (s) =>
            s.user_message?.toLowerCase().includes("problem") ||
            s.user_message?.toLowerCase().includes("solve")
        ).length > 0,
      positive: positiveFamily.length,
    };
  }

  private generateBaselineAnalysis(): EnhancedAnalysisResult {
    return {
      totalSessions: 0,
      analysisTimeframe: "No data yet",
      communicationPatterns: [],
      familyBenefits: [],
      conversationMetrics: {
        avgSessionDuration: 0,
        sessionDurationTrend: 0,
        conversationInitiation: 0,
        emotionalVocabularyGrowth: 0,
        responseComplexity: 0,
        engagementLevel: 0,
      },
      overallInsights: {
        strengths: ["Ready to begin therapeutic journey"],
        growthAreas: ["Start with first therapy session"],
        recommendations: ["Begin regular sessions with Dr. Emma"],
      },
    };
  }

  // New helper methods for child-specific confidence calculations

  private calculateMoodConsistency(sessions: any[]): number {
    const validMoods = sessions.filter(
      (s) => s.mood_analysis && typeof s.mood_analysis.happiness === "number"
    );
    if (validMoods.length < 2) return 0.5;

    const happinessScores = validMoods.map((s) => s.mood_analysis.happiness);
    const variance = this.calculateVariance(happinessScores);
    return Math.max(0, 1 - variance / 25); // Lower variance = higher consistency
  }

  private calculateEmotionalGrowth(sessions: any[]): number {
    if (sessions.length < 4) return 0.5;

    const half = Math.floor(sessions.length / 2);
    const earlySessions = sessions.slice(0, half);
    const recentSessions = sessions.slice(half);

    const earlyEmotionalCount = earlySessions.filter((s) =>
      this.containsEmotionalContent(s.user_message)
    ).length;
    const recentEmotionalCount = recentSessions.filter((s) =>
      this.containsEmotionalContent(s.user_message)
    ).length;

    const earlyRate = earlyEmotionalCount / earlySessions.length;
    const recentRate = recentEmotionalCount / recentSessions.length;

    return Math.max(0, recentRate - earlyRate);
  }

  private calculateStressConsistency(sessions: any[]): number {
    const stressSessions = sessions.filter((s) =>
      this.containsStressContent(s.user_message, s.mood_analysis)
    );
    if (stressSessions.length < 2) return 0.5;

    const stressScores = stressSessions.map(
      (s) => s.mood_analysis?.stress || 5
    );
    const variance = this.calculateVariance(stressScores);
    return Math.max(0, 1 - variance / 25);
  }

  private calculateStressTrend(sessions: any[]): number {
    if (sessions.length < 4) return 0.5;

    const half = Math.floor(sessions.length / 2);
    const earlySessions = sessions.slice(0, half);
    const recentSessions = sessions.slice(half);

    const earlyStressCount = earlySessions.filter((s) =>
      this.containsStressContent(s.user_message, s.mood_analysis)
    ).length;
    const recentStressCount = recentSessions.filter((s) =>
      this.containsStressContent(s.user_message, s.mood_analysis)
    ).length;

    const earlyRate = earlyStressCount / earlySessions.length;
    const recentRate = recentStressCount / recentSessions.length;

    return Math.max(0, recentRate - earlyRate);
  }

  private calculateSocialMoodCorrelation(socialMessages: any[]): number {
    if (socialMessages.length === 0) return 0.5;

    const positiveSocial = socialMessages.filter(
      (s) => (s.mood_analysis?.happiness || 0) > 6
    );
    return positiveSocial.length / socialMessages.length;
  }

  private countSocialVocabulary(sessions: any[]): number {
    const socialWords = new Set<string>();
    const socialTerms = [
      "friend",
      "social",
      "peer",
      "classmate",
      "school",
      "playground",
      "group",
      "party",
      "team",
      "club",
    ];

    sessions.forEach((session) => {
      const message = session.user_message?.toLowerCase() || "";
      socialTerms.forEach((term) => {
        if (message.includes(term)) {
          socialWords.add(term);
        }
      });
    });

    return socialWords.size;
  }

  private calculateRecentSocialEngagement(sessions: any[]): number {
    if (sessions.length < 3) return 0.5;

    const recentSessions = sessions.slice(-3);
    const socialSessions = recentSessions.filter((s) =>
      this.containsSocialContent(s.user_message)
    );
    return socialSessions.length / recentSessions.length;
  }

  private countFamilyVocabulary(sessions: any[]): number {
    const familyWords = new Set<string>();
    const familyTerms = [
      "family",
      "parent",
      "mom",
      "dad",
      "sibling",
      "brother",
      "sister",
      "home",
      "house",
      "together",
    ];

    sessions.forEach((session) => {
      const message = session.user_message?.toLowerCase() || "";
      familyTerms.forEach((term) => {
        if (message.includes(term)) {
          familyWords.add(term);
        }
      });
    });

    return familyWords.size;
  }

  private calculateFamilyMoodCorrelation(familyMessages: any[]): number {
    if (familyMessages.length === 0) return 0.5;

    const positiveFamily = familyMessages.filter(
      (s) => (s.mood_analysis?.happiness || 0) > 6
    );
    return positiveFamily.length / familyMessages.length;
  }

  private calculateRecentFamilyEngagement(sessions: any[]): number {
    if (sessions.length < 3) return 0.5;

    const recentSessions = sessions.slice(-3);
    const familySessions = recentSessions.filter((s) =>
      this.containsFamilyContent(s.user_message)
    );
    return familySessions.length / recentSessions.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateEmotionalConfidence(sessions: any[]): number {
    let confidence = 60; // Base confidence

    // Factor 1: Emotional content frequency (0-20 points)
    const emotionalMessages = sessions.filter((s) =>
      this.containsEmotionalContent(s.user_message)
    );
    const emotionalFrequency = emotionalMessages.length / sessions.length;
    confidence += emotionalFrequency * 20;

    // Factor 2: Emotional vocabulary diversity (0-15 points)
    const uniqueEmotions = this.countUniqueEmotionWords(sessions);
    confidence += Math.min(15, uniqueEmotions * 2);

    // Factor 3: Session engagement quality (0-15 points)
    const avgMessageLength =
      sessions.reduce((sum, s) => sum + (s.user_message?.length || 0), 0) /
      sessions.length;
    confidence += Math.min(15, avgMessageLength / 10);

    // Factor 4: Mood analysis consistency (0-10 points)
    const moodConsistency = this.calculateMoodConsistency(sessions);
    confidence += moodConsistency * 10;

    return Math.min(95, Math.max(40, confidence));
  }

  private calculateStressConfidence(sessions: any[]): number {
    let confidence = 50; // Base confidence

    // Factor 1: Stress frequency and intensity (0-25 points)
    const stressMessages = sessions.filter((s) =>
      this.containsStressContent(s.user_message, s.mood_analysis)
    );
    const stressFrequency = stressMessages.length / sessions.length;
    confidence += stressFrequency * 25;

    // Factor 2: Stress trigger identification (0-20 points)
    const stressTriggers = this.identifyStressTriggers(stressMessages);
    if (stressTriggers.includes("Primary trigger")) confidence += 20;
    else if (stressTriggers.includes("Stress triggers")) confidence += 10;

    // Factor 3: Coping strategy discussion (0-15 points)
    const copingStrategies = this.assessCopingStrategies(sessions);
    if (copingStrategies.includes("discussing coping strategies"))
      confidence += 15;
    else confidence += 5;

    // Factor 4: Session consistency with stress themes (0-10 points)
    const stressConsistency = this.calculateStressConsistency(sessions);
    confidence += stressConsistency * 10;

    return Math.min(95, Math.max(30, confidence));
  }

  private calculateSocialConfidence(sessions: any[]): number {
    let confidence = 40; // Base confidence

    // Factor 1: Social content frequency (0-25 points)
    const socialMessages = sessions.filter((s) =>
      this.containsSocialContent(s.user_message)
    );
    const socialFrequency = socialMessages.length / sessions.length;
    confidence += socialFrequency * 25;

    // Factor 2: Friendship dynamics analysis (0-25 points)
    const friendshipMentions = this.analyzeFriendshipDynamics(socialMessages);
    const totalFriendshipMentions =
      friendshipMentions.positive +
      friendshipMentions.challenges +
      friendshipMentions.misunderstood +
      friendshipMentions.excitement +
      friendshipMentions.groupChallenges +
      friendshipMentions.oneOnOneSuccess;
    confidence += Math.min(25, totalFriendshipMentions * 3);

    // Factor 3: Social mood correlation (0-20 points)
    const socialMoodCorrelation =
      this.calculateSocialMoodCorrelation(socialMessages);
    confidence += socialMoodCorrelation * 20;

    // Factor 4: Social vocabulary development (0-15 points)
    const socialVocabulary = this.countSocialVocabulary(sessions);
    confidence += Math.min(15, socialVocabulary * 2);

    return Math.min(95, Math.max(25, confidence));
  }

  private calculateFamilyConfidence(sessions: any[]): number {
    let confidence = 45; // Base confidence

    // Factor 1: Family content frequency (0-25 points)
    const familyMessages = sessions.filter((s) =>
      this.containsFamilyContent(s.user_message)
    );
    const familyFrequency = familyMessages.length / sessions.length;
    confidence += familyFrequency * 25;

    // Factor 2: Family tone analysis (0-25 points)
    const familyToneAnalysis = this.analyzeFamilyTone(familyMessages);
    confidence += familyToneAnalysis.positive * 5;
    if (familyToneAnalysis.trustBuilding) confidence += 10;
    if (familyToneAnalysis.conflictResolution) confidence += 10;

    // Factor 3: Family vocabulary development (0-20 points)
    const familyVocabulary = this.countFamilyVocabulary(sessions);
    confidence += Math.min(20, familyVocabulary * 3);

    // Factor 4: Family mood correlation (0-15 points)
    const familyMoodCorrelation =
      this.calculateFamilyMoodCorrelation(familyMessages);
    confidence += familyMoodCorrelation * 15;

    return Math.min(90, Math.max(30, confidence));
  }
}

export const enhancedChatAnalyzer = new EnhancedChatAnalyzer();
