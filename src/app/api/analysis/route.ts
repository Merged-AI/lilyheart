import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { childAnalyzer, ChildAnalysis } from "@/lib/ai-analysis";
import { enhancedChatAnalyzer } from "@/lib/enhanced-chat-analysis";
import { getAuthenticatedFamilyFromToken } from "@/lib/supabase-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const analysisType = url.searchParams.get("type") || "comprehensive";
    const timeframe = parseInt(url.searchParams.get("days") || "30");
    const requestedChildId = url.searchParams.get("childId");

    const family = await getAuthenticatedFamilyFromToken();
    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let child;
    let childError;

    if (requestedChildId) {
      const { data: requestedChild, error: reqChildError } = await supabase
        .from("children")
        .select("id, name, age, current_concerns")
        .eq("id", requestedChildId)
        .eq("family_id", family.id)
        .single();

      child = requestedChild;
      childError = reqChildError;
    } else {
      const { data: recentChild, error: recentChildError } = await supabase
        .from("children")
        .select("id, name, age, current_concerns")
        .eq("family_id", family.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      child = recentChild;
      childError = recentChildError;
    }

    if (childError || !child) {
      return NextResponse.json(
        {
          error: "No children found or access denied",
          analysis: null,
        },
        { status: 404 }
      );
    }

    console.log(
      `Analysis API: Analyzing child ${child.id} (${child.name}) for ${timeframe} days`
    );

    // Use enhanced chat analyzer for comprehensive analysis
    if (analysisType === "comprehensive") {
      try {
        const enhancedAnalysis =
          await enhancedChatAnalyzer.generateComprehensiveAnalysis(
            child.id,
            timeframe
          );

        console.log(`Enhanced analysis completed for child ${child.id}:`, {
          totalSessions: enhancedAnalysis.totalSessions,
          patterns: enhancedAnalysis.communicationPatterns.length,
          benefits: enhancedAnalysis.familyBenefits.length,
        });

        // Convert enhanced analysis to the expected format
        const convertedAnalysis = convertEnhancedToStandardAnalysis(
          enhancedAnalysis,
          child
        );

        // Generate parent insights
        const parentInsights = generateParentInsights(convertedAnalysis, child);

        return NextResponse.json({
          type: "comprehensive",
          child: {
            id: child.id,
            name: child.name,
            age: child.age,
          },
          analysis: convertedAnalysis,
          parentInsights: parentInsights,
          conversationCount: enhancedAnalysis.totalSessions,
          analysisTimestamp: new Date().toISOString(),
          enhancedAnalysis: enhancedAnalysis, // Include the full enhanced analysis
        });
      } catch (enhancedError) {
        console.error(
          "Error with enhanced analysis, falling back to standard analysis:",
          enhancedError
        );
        // Fall back to standard analysis if enhanced analysis fails
      }
    }

    // Get conversation history for standard analysis
    const { data: conversations, error: conversationError } = await supabase
      .from("therapy_sessions")
      .select("*")
      .eq("child_id", child.id)
      .gte(
        "created_at",
        new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("created_at", { ascending: true });

    if (conversationError) {
      console.error("Error fetching conversations:", conversationError);
      return NextResponse.json(
        {
          error: "Failed to fetch conversation data",
          analysis: null,
        },
        { status: 500 }
      );
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        message: "No conversation data available for analysis",
        analysis: generateInitialAnalysis(child),
      });
    }

    let analysis: ChildAnalysis;

    switch (analysisType) {
      case "comprehensive":
        analysis = await childAnalyzer.analyzeConversationHistory(
          child.id,
          conversations
        );
        break;

      case "progress":
        const progressAnalysis = await childAnalyzer.analyzeProgressOverTime(
          child.id,
          timeframe
        );
        return NextResponse.json({
          type: "progress",
          child: child,
          analysis: progressAnalysis,
        });

      case "solutions":
        const concerns = extractConcernsFromConversations(conversations);
        const solutions = await childAnalyzer.generateParentSolutions(
          concerns,
          child.age
        );
        return NextResponse.json({
          type: "solutions",
          child: child,
          solutions: solutions,
        });

      default:
        analysis = await childAnalyzer.analyzeConversationHistory(
          child.id,
          conversations
        );
    }

    // Store analysis results for tracking
    await storeAnalysisResults(child.id, analysis);

    // Generate parent insights
    const parentInsights = generateParentInsights(analysis, child);

    return NextResponse.json({
      type: "comprehensive",
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
      },
      analysis: analysis,
      parentInsights: parentInsights,
      conversationCount: conversations.length,
      analysisTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in analysis API:", error);
    return NextResponse.json(
      {
        error: "Internal server error during analysis",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}

function extractConcernsFromConversations(conversations: any[]): string[] {
  const concerns = new Set<string>();

  conversations.forEach((conv) => {
    const message = conv.user_message?.toLowerCase() || "";
    const moodAnalysis = conv.mood_analysis || {};

    // Extract concerns based on conversation content
    if (
      message.includes("anxious") ||
      message.includes("worried") ||
      moodAnalysis.anxiety > 6
    ) {
      concerns.add("Anxiety management");
    }
    if (
      message.includes("sad") ||
      message.includes("depressed") ||
      moodAnalysis.sadness > 6
    ) {
      concerns.add("Mood regulation");
    }
    if (
      message.includes("angry") ||
      message.includes("mad") ||
      moodAnalysis.anger > 6
    ) {
      concerns.add("Anger management");
    }
    if (message.includes("school") || message.includes("teacher")) {
      concerns.add("Academic stress");
    }
    if (message.includes("friend") || message.includes("social")) {
      concerns.add("Social relationships");
    }
    if (message.includes("family") || message.includes("parent")) {
      concerns.add("Family dynamics");
    }
    if (message.includes("sleep") || message.includes("tired")) {
      concerns.add("Sleep concerns");
    }
  });

  return Array.from(concerns);
}

async function storeAnalysisResults(childId: string, analysis: ChildAnalysis) {
  try {
    await supabase.from("analysis_results").insert({
      child_id: childId,
      analysis_data: analysis,
      risk_level: analysis.overallRiskLevel,
      primary_concerns: analysis.primaryConcerns,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error storing analysis results:", error);
  }
}

function generateParentInsights(analysis: ChildAnalysis, child: any) {
  return {
    riskAssessment: {
      level: analysis.overallRiskLevel,
      description: getRiskDescription(analysis.overallRiskLevel),
      urgency: getRiskUrgency(analysis.overallRiskLevel),
    },
    keyFindings: analysis.primaryConcerns.slice(0, 3),
    immediateActions: analysis.immediateActions.filter(
      (action) => action.priority === "immediate"
    ),
    weeklyFocus: analysis.weeklyGoals.slice(0, 2),
    professionalRecommendation:
      analysis.therapyRecommendations.length > 0
        ? {
            recommended: true,
            urgency: analysis.therapyRecommendations[0].urgency,
            type: analysis.therapyRecommendations[0].type,
            rationale: analysis.therapyRecommendations[0].rationale,
          }
        : {
            recommended: false,
            message: "Continue current supportive approach",
          },
    progressMetrics: analysis.progressTracking.slice(0, 3),
    nextSteps: generateNextSteps(analysis),
  };
}

function getRiskDescription(riskLevel: string): string {
  switch (riskLevel) {
    case "low":
      return "Your child is showing good emotional stability with normal developmental challenges.";
    case "moderate":
      return "Some areas of concern that would benefit from attention and support.";
    case "high":
      return "Significant emotional distress requiring immediate attention and professional consultation.";
    case "crisis":
      return "Immediate intervention required. Please contact a mental health professional today.";
    default:
      return "Assessment in progress.";
  }
}

function getRiskUrgency(riskLevel: string): string {
  switch (riskLevel) {
    case "low":
      return "Continue current supportive approach";
    case "moderate":
      return "Implement recommended strategies within 1-2 weeks";
    case "high":
      return "Take action within 24-48 hours";
    case "crisis":
      return "Immediate intervention required";
    default:
      return "Monitor and assess";
  }
}

function generateNextSteps(analysis: ChildAnalysis): string[] {
  const steps = [];

  if (analysis.immediateActions.length > 0) {
    steps.push(
      `Implement immediate action: ${analysis.immediateActions[0].title}`
    );
  }

  if (analysis.therapyRecommendations.length > 0) {
    const rec = analysis.therapyRecommendations[0];
    steps.push(`Consider ${rec.type} therapy ${rec.urgency}`);
  }

  if (analysis.progressTracking.length > 0) {
    steps.push(`Begin tracking: ${analysis.progressTracking[0].metric}`);
  }

  steps.push("Schedule follow-up analysis in 1-2 weeks");

  return steps;
}

function generateInitialAnalysis(child: any): ChildAnalysis {
  return {
    overallRiskLevel: "low",
    primaryConcerns: ["Initial assessment needed"],
    behavioralPatterns: [],
    potentialConditions: [],
    symptomSeverity: {
      anxiety: { level: 5, symptoms: [] },
      depression: { level: 5, symptoms: [] },
      adhd: { level: 5, symptoms: [] },
      anger: { level: 5, symptoms: [] },
      trauma: { level: 5, symptoms: [] },
    },
    immediateActions: [
      {
        priority: "important",
        category: "communication",
        title: "Begin regular emotional check-ins",
        description: "Start building therapeutic rapport with your child",
        steps: [
          "Have your child complete a therapy session with Dr. Emma",
          "Observe their comfort level and engagement",
          "Ask about their experience afterward",
        ],
        timeframe: "This week",
        expectedOutcome: "Baseline assessment and comfort with AI therapy",
      },
    ],
    weeklyGoals: [],
    longTermStrategy: {
      focus: "Establishing baseline and building trust",
      approach: "Gentle introduction to emotional expression",
      timeline: "2-4 weeks",
      milestones: ["Comfortable with Dr. Emma", "Regular session completion"],
      parentSupport: ["Encourage participation", "Review session summaries"],
      professionalSupport: ["Monitor for concerning patterns"],
    },
    therapyRecommendations: [],
    interventionPlan: {
      phase: "assessment",
      techniques: ["AI-guided conversation", "Mood tracking"],
      parentInvolvement: ["Weekly review", "Supportive encouragement"],
      schoolCoordination: [],
      duration: "2-4 weeks initial assessment",
    },
    progressTracking: [
      {
        metric: "Session completion rate",
        baseline: 0,
        target: 3,
        timeframe: "1 week",
        trackingMethod: "Platform monitoring",
      },
    ],
  };
}

// Convert enhanced analysis to standard analysis format
function convertEnhancedToStandardAnalysis(
  enhancedAnalysis: any,
  child: any
): ChildAnalysis {
  // Determine risk level based on communication patterns
  const highConfidencePatterns = enhancedAnalysis.communicationPatterns.filter(
    (p: any) => p.confidence > 80
  );
  const lowConfidencePatterns = enhancedAnalysis.communicationPatterns.filter(
    (p: any) => p.confidence < 50
  );

  let riskLevel: "low" | "moderate" | "high" | "crisis" = "low";
  if (lowConfidencePatterns.length > 2) riskLevel = "moderate";
  if (highConfidencePatterns.length > 2) riskLevel = "high";

  // Extract primary concerns from patterns
  const primaryConcerns = enhancedAnalysis.communicationPatterns
    .filter((p: any) => p.confidence > 60)
    .map((p: any) => p.title);

  // Generate behavioral patterns from communication patterns
  const behavioralPatterns = enhancedAnalysis.communicationPatterns.map(
    (pattern: any) => ({
      type: "trigger-based" as const,
      description: pattern.observations.join(". "),
      frequency: "regular",
      triggers: pattern.observations.filter((obs: string) =>
        obs.includes("trigger")
      ),
      impact:
        pattern.confidence > 80
          ? "severe"
          : pattern.confidence > 60
          ? "moderate"
          : "mild",
      trend: "stable" as const,
    })
  );

  // Generate symptom severity from conversation metrics
  const metrics = enhancedAnalysis.conversationMetrics;
  const symptomSeverity = {
    anxiety: {
      level: Math.min(10, Math.max(1, 10 - metrics.engagementLevel)),
      symptoms: ["Communication difficulties", "Low engagement"],
    },
    depression: {
      level: Math.min(10, Math.max(1, 10 - metrics.emotionalVocabularyGrowth)),
      symptoms: ["Limited emotional expression"],
    },
    adhd: {
      level: Math.min(10, Math.max(1, 10 - metrics.responseComplexity)),
      symptoms: ["Simple responses", "Short attention span"],
    },
    anger: {
      level: 5,
      symptoms: ["Standard range"],
    },
    trauma: {
      level: 3,
      symptoms: ["No significant indicators"],
    },
  };

  // Generate immediate actions from family benefits
  const immediateActions = enhancedAnalysis.familyBenefits.map(
    (benefit: any) => ({
      priority: "important" as const,
      category: "communication" as const,
      title: benefit.area,
      description: benefit.benefit,
      steps: benefit.suggestedActions,
      timeframe: "ongoing",
      expectedOutcome: benefit.currentProgress,
    })
  );

  // Generate weekly goals from overall insights
  const weeklyGoals = enhancedAnalysis.overallInsights.recommendations.map(
    (rec: string) => ({
      area: "Communication",
      objective: rec,
      activities: ["Practice daily", "Monitor progress"],
      measurableOutcome: "Improved communication",
      parentRole: "Support and encourage",
      childRole: "Participate actively",
    })
  );

  return {
    overallRiskLevel: riskLevel,
    primaryConcerns,
    behavioralPatterns,
    potentialConditions: [],
    symptomSeverity,
    immediateActions,
    weeklyGoals,
    longTermStrategy: {
      focus: "Communication development",
      approach: "Consistent therapeutic engagement",
      timeline: "6-12 months",
      milestones: [
        "Improved emotional expression",
        "Better family communication",
      ],
      parentSupport: ["Regular check-ins", "Emotional validation"],
      professionalSupport: ["Continued therapy sessions"],
    },
    therapyRecommendations: [
      {
        type: "play-therapy",
        urgency: "within-month",
        rationale: "Build communication skills through play",
        expectedBenefits: [
          "Improved emotional expression",
          "Better family relationships",
        ],
      },
    ],
    interventionPlan: {
      phase: "treatment",
      techniques: ["Communication exercises", "Emotional vocabulary building"],
      parentInvolvement: ["Active listening", "Emotional validation"],
      schoolCoordination: ["Monitor social interactions"],
      duration: "Ongoing",
    },
    progressTracking: [
      {
        metric: "Communication confidence",
        baseline: metrics.conversationInitiation,
        target: 80,
        timeframe: "3 months",
        trackingMethod: "Session observations",
      },
    ],
  };
}
