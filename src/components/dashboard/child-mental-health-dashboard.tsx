"use client";

import { useState, useEffect } from "react";
import { Brain, TrendingUp } from "lucide-react";
import { formatSessionDuration } from "@/lib/utils";

// Mock data for mental health analytics
const moodData = [
  {
    date: "2024-01-15",
    happiness: 7,
    anxiety: 3,
    sadness: 2,
    anger: 1,
    stress: 4,
  },
  {
    date: "2024-01-16",
    happiness: 6,
    anxiety: 4,
    sadness: 3,
    anger: 2,
    stress: 5,
  },
  {
    date: "2024-01-17",
    happiness: 5,
    anxiety: 6,
    sadness: 4,
    anger: 3,
    stress: 7,
  },
  {
    date: "2024-01-18",
    happiness: 4,
    anxiety: 7,
    sadness: 6,
    anger: 2,
    stress: 8,
  },
  {
    date: "2024-01-19",
    happiness: 3,
    anxiety: 8,
    sadness: 7,
    anger: 4,
    stress: 9,
  },
  {
    date: "2024-01-20",
    happiness: 4,
    anxiety: 7,
    sadness: 6,
    anger: 3,
    stress: 8,
  },
  {
    date: "2024-01-21",
    happiness: 5,
    anxiety: 6,
    sadness: 5,
    anger: 2,
    stress: 7,
  },
];

const therapySessions = [
  {
    id: 1,
    date: "2024-01-21",
    time: "4:30 PM",
    duration: 45,
    mood: "Anxious",
    topics: ["School stress", "Friend conflicts", "Sleep problems"],
    insights:
      "Child expressed significant worry about upcoming tests and peer relationships.",
    recommendations: [
      "Practice relaxation techniques",
      "Schedule teacher conference",
      "Establish bedtime routine",
    ],
  },
  {
    id: 2,
    date: "2024-01-20",
    time: "4:15 PM",
    duration: 38,
    mood: "Sad",
    topics: ["Bullying", "Self-esteem", "Family dynamics"],
    insights:
      "Reported bullying incidents at school affecting self-confidence.",
    recommendations: [
      "Contact school counselor",
      "Build confidence activities",
      "Family communication session",
    ],
  },
  {
    id: 3,
    date: "2024-01-19",
    time: "4:45 PM",
    duration: 52,
    mood: "Overwhelmed",
    topics: ["Academic pressure", "Time management", "Social anxiety"],
    insights:
      "Struggling with workload and social situations causing significant stress.",
    recommendations: [
      "Study schedule planning",
      "Social skills practice",
      "Stress management techniques",
    ],
  },
];

const alertsData = [
  {
    id: 1,
    type: "high",
    title: "Elevated Anxiety Levels",
    description: "Consistent anxiety scores above 7/10 for 3 consecutive days",
    timestamp: "2 hours ago",
    action: "Consider scheduling in-person therapy session",
  },
  {
    id: 2,
    type: "medium",
    title: "Social Withdrawal Pattern",
    description:
      "Decreased discussion of peer interactions and social activities",
    timestamp: "1 day ago",
    action: "Encourage social activities and check with teachers",
  },
];

export function ChildMentalHealthDashboard({
  selectedChildId,
}: {
  selectedChildId?: string;
}) {
  const [showDetailedPattern, setShowDetailedPattern] = useState<string | null>(
    null
  );
  const [realTimeData, setRealTimeData] = useState({
    sessions: therapySessions,
    moodData: moodData,
    alerts: alertsData,
  });
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedChildId) {
      setIsLoading(true);
      Promise.all([fetchRealTimeData(), fetchEnhancedAnalysis()]).finally(() =>
        setIsLoading(false)
      );
    }
  }, [selectedChildId]);

  const fetchRealTimeData = async () => {
    try {
      // Fetch recent therapy sessions for selected child
      const sessionsUrl = `/api/sessions?limit=10&childId=${selectedChildId}`;

      const sessionsResponse = await fetch(sessionsUrl);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();

        // Transform database sessions to component format
        const transformedSessions = sessionsData.sessions.map(
          (session: any, index: number) => ({
            id: session.id || index + 1,
            date: new Date(session.created_at).toLocaleDateString(),
            time: new Date(session.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            duration: session.session_duration || 0,
            mood: getMoodFromAnalysis(session.mood_analysis),
            topics: session.topics || ["General conversation"],
            insights:
              session.ai_response?.substring(0, 200) + "..." ||
              "AI provided supportive guidance.",
            recommendations: getRecommendationsFromMood(session.mood_analysis),
          })
        );

        setRealTimeData((prev) => ({
          ...prev,
          sessions: transformedSessions,
        }));
      }

      // Update mood data based on recent sessions for selected child
      if (selectedChildId) {
        const moodUrl = `/api/mood-tracking?days=7&childId=${selectedChildId}`;
        const moodResponse = await fetch(moodUrl);
        if (moodResponse.ok) {
          const moodDataResponse = await moodResponse.json();
          setRealTimeData((prev) => ({
            ...prev,
            moodData: moodDataResponse.moodData || moodData,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching real-time data:", error);
    }
  };

  const fetchEnhancedAnalysis = async () => {
    try {
      const url = new URL("/api/enhanced-analysis", window.location.origin);
      url.searchParams.set("days", "30");
      if (selectedChildId) {
        url.searchParams.set("childId", selectedChildId);
      }

      const response = await fetch(url.toString());
      if (response.ok) {
        const analysisData = await response.json();
        // The API returns the analysis nested under .analysis property
        setEnhancedAnalysis(analysisData.analysis || null);
      }
    } catch (error) {
      console.error("Error fetching enhanced analysis:", error);
    }
  };

  // Get mood label from AI analysis
  const getMoodFromAnalysis = (moodAnalysis: any) => {
    if (!moodAnalysis) return "Neutral";

    const {
      anxiety = 5,
      sadness = 5,
      happiness = 5,
      stress = 5,
    } = moodAnalysis;

    // Use AI insights if available
    if (moodAnalysis.insights) {
      const insights = moodAnalysis.insights.toLowerCase();
      if (insights.includes("anxious") || insights.includes("anxiety"))
        return "Anxious";
      if (
        insights.includes("sad") ||
        insights.includes("sadness") ||
        insights.includes("depressive")
      )
        return "Sad";
      if (insights.includes("stress") || insights.includes("overwhelmed"))
        return "Stressed";
      if (insights.includes("happy") || insights.includes("positive"))
        return "Happy";
      if (insights.includes("crisis") || insights.includes("concerning"))
        return "Concerning";
    }

    // Fallback to score-based analysis
    if (anxiety >= 7) return "Anxious";
    if (sadness >= 7) return "Sad";
    if (stress >= 7) return "Stressed";
    if (happiness >= 7) return "Happy";
    if (anxiety >= 6 || sadness >= 6 || stress >= 6) return "Mixed";

    return "Neutral";
  };

  // Get recommendations from AI analysis
  const getRecommendationsFromMood = (moodAnalysis: any) => {
    if (!moodAnalysis) return ["Continue regular check-ins"];

    const recommendations = [];
    const {
      anxiety = 5,
      sadness = 5,
      stress = 5,
      confidence = 5,
    } = moodAnalysis;

    // Use AI insights if available
    if (moodAnalysis.insights) {
      const insights = moodAnalysis.insights.toLowerCase();

      if (insights.includes("anxiety") || insights.includes("worried")) {
        recommendations.push("Practice breathing exercises together");
        recommendations.push("Consider anxiety management techniques");
      }

      if (insights.includes("sad") || insights.includes("depressive")) {
        recommendations.push("Schedule quality time together");
        recommendations.push("Encourage expression of feelings");
      }

      if (insights.includes("stress") || insights.includes("overwhelmed")) {
        recommendations.push("Review daily schedule and reduce pressure");
        recommendations.push("Introduce stress-relief activities");
      }

      if (insights.includes("confidence") || insights.includes("self-esteem")) {
        recommendations.push("Focus on building self-esteem");
        recommendations.push("Celebrate small achievements");
      }

      if (insights.includes("crisis") || insights.includes("professional")) {
        recommendations.push("Consider professional mental health support");
        recommendations.push("Contact mental health professional");
      }
    }

    // Fallback to score-based recommendations
    if (anxiety >= 6) {
      recommendations.push("Practice breathing exercises together");
      recommendations.push("Consider anxiety management techniques");
    }
    if (sadness >= 6) {
      recommendations.push("Schedule quality time together");
      recommendations.push("Encourage expression of feelings");
    }
    if (stress >= 6) {
      recommendations.push("Review daily schedule and reduce pressure");
      recommendations.push("Introduce stress-relief activities");
    }
    if (confidence <= 3) {
      recommendations.push("Focus on building self-esteem");
      recommendations.push("Celebrate small achievements");
    }

    return recommendations.length > 0
      ? recommendations
      : ["Continue supportive conversations"];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analysis Area Loading */}
        <div className="lg:col-span-2 space-y-8">
          {/* Communication Pattern Insights Loading */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Family Communication Growth Loading */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="border-l-4 border-gray-200 pl-6 py-4">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conversation History Loading */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between mb-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="flex gap-1">
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Loading */}
        <div className="space-y-6">
          {/* Family Communication Summary Loading */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Conversation Prep Loading */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          {/* Family Wellness Resources Loading */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Family Action Items Loading */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Analysis Area */}
      <div className="lg:col-span-2 space-y-8">
        {/* Communication Pattern Insights */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-semibold text-gray-900"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Family Communication Insights & Patterns
            </h2>
            <div className="text-sm text-gray-500">
              Based on{" "}
              {enhancedAnalysis?.totalSessions || realTimeData.sessions.length}{" "}
              therapy sessions
            </div>
          </div>

          <div className="space-y-6">
            {enhancedAnalysis &&
            enhancedAnalysis.communicationPatterns &&
            enhancedAnalysis.communicationPatterns.length > 0 ? (
              enhancedAnalysis.communicationPatterns.map((pattern: any) => (
                <div
                  key={pattern.id}
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {pattern.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-32">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${pattern.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {pattern.confidence}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setShowDetailedPattern(
                          showDetailedPattern === pattern.id ? null : pattern.id
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {showDetailedPattern === pattern.id
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                  </div>

                  {showDetailedPattern === pattern.id && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Observations:
                        </h4>
                        <ul className="space-y-1">
                          {pattern.observations?.map(
                            (observation: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 flex items-start space-x-2"
                              >
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{observation}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Parent Insights:
                        </h4>
                        <ul className="space-y-1">
                          {pattern.parentInsights?.map(
                            (insight: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-purple-700 flex items-start space-x-2"
                              >
                                <span className="text-purple-500 mt-1">?</span>
                                <span>{insight}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">
                          Communication Tips:
                        </h4>
                        <div className="text-sm text-blue-800">
                          {Array.isArray(pattern.communicationTips) ? (
                            <ul className="space-y-1">
                              {pattern.communicationTips.map(
                                (tip: string, index: number) => (
                                  <li key={index}>• {tip}</li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p>{pattern.communicationTips}</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-1">
                          Recommended Next Step:
                        </h4>
                        <p className="text-sm text-green-800">
                          {pattern.recommendedNextStep || pattern.nextSteps}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <Brain size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">
                    No Analysis Available Yet
                  </p>
                  <p className="text-sm">
                    Complete more therapy sessions to see communication patterns
                    and insights.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Family Communication Growth */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2
            className="text-xl font-semibold text-gray-900 mb-6"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Family Communication Growth & Development
          </h2>

          <div className="space-y-6">
            {enhancedAnalysis &&
            enhancedAnalysis.familyBenefits &&
            enhancedAnalysis.familyBenefits.length > 0 ? (
              enhancedAnalysis.familyBenefits.map(
                (benefit: any, index: number) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-400 pl-6 py-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {benefit.area}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          benefit.currentProgress === "Growing Confidence"
                            ? "bg-green-100 text-green-700"
                            : benefit.currentProgress === "Developing Awareness"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {benefit.currentProgress}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {benefit.benefit}
                    </p>

                    <div className="space-y-2">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          Suggested Actions:
                        </p>
                        <div className="text-sm text-green-800">
                          {Array.isArray(benefit.suggestedActions) ? (
                            <ul className="space-y-1">
                              {benefit.suggestedActions.map(
                                (action: string, actionIndex: number) => (
                                  <li key={actionIndex}>• {action}</li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p>{benefit.suggestedActions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">
                    Family Growth Analysis Coming Soon
                  </p>
                  <p className="text-sm">
                    More sessions needed to generate family communication
                    insights.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversation History */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2
            className="text-xl font-semibold text-gray-900 mb-6"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Recent Conversations & Emotional Check-ins
          </h2>

          <div className="space-y-4">
            {realTimeData.sessions.slice(0, 5).map((session, index) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {session.date} at {session.time}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatSessionDuration(session.duration)}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.mood === "Anxious"
                        ? "bg-red-100 text-red-700"
                        : session.mood === "Sad"
                        ? "bg-blue-100 text-blue-700"
                        : session.mood === "Happy"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {session.mood}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Key Themes:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {session.topics.map((topic, topicIndex) => (
                        <span
                          key={topicIndex}
                          className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Clinical Notes:
                    </p>
                    <p className="text-xs text-gray-600">{session.insights}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        {/* Family Communication Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3
            className="text-lg font-semibold text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Family Communication Summary
          </h3>

          <div className="space-y-4">
            {enhancedAnalysis && enhancedAnalysis.overallInsights ? (
              <>
                <div>
                  <h4 className="font-medium text-green-800 mb-2">
                    Communication Strengths:
                  </h4>
                  <ul className="space-y-1">
                    {enhancedAnalysis.overallInsights.strengths?.map(
                      (strength: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-green-700 flex items-start space-x-2"
                        >
                          <span className="text-green-500">+</span>
                          <span>{strength}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-orange-800 mb-2">
                    Areas for Family Growth:
                  </h4>
                  <ul className="space-y-1">
                    {enhancedAnalysis.overallInsights.growthAreas?.map(
                      (area: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-orange-700 flex items-start space-x-2"
                        >
                          <span className="text-orange-500">•</span>
                          <span>{area}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-blue-800 mb-2">
                    Recommendations:
                  </h4>
                  <ul className="space-y-1">
                    {enhancedAnalysis.overallInsights.recommendations?.map(
                      (rec: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-blue-700 flex items-start space-x-2"
                        >
                          <span className="text-blue-500">→</span>
                          <span>{rec}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Analysis data will appear here after more therapy sessions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Conversation Prep */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <h3
            className="text-lg font-semibold text-purple-900 mb-4"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Professional Conversation Organization
          </h3>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">
                Key Conversation Topics:
              </h4>
              <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                <li>Communication patterns and family dynamics</li>
                <li>Emotional wellness and stress management</li>
                <li>Social relationships and friendship development</li>
                <li>School experiences and learning environment</li>
              </ol>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2">
                Questions to Consider:
              </h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>
                  • How can we better support our child's emotional needs?
                </li>
                <li>
                  • What communication strategies work best for our family?
                </li>
                <li>• Are there resources to help with stress management?</li>
                <li>• How can we strengthen family relationships?</li>
              </ul>
            </div>

            <button className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
              Organize Family Conversation Notes
            </button>
          </div>
        </div>

        {/* Family Wellness Resources */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3
            className="text-lg font-semibold text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Family Communication & Wellness Tips
          </h3>

          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 text-sm">
                Building Trust in Conversations
              </h4>
              <p className="text-xs text-blue-700 mt-1">
                Regular check-ins without pressure create safe spaces for
                children to share their feelings naturally.
              </p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 text-sm">
                Understanding Emotional Expression
              </h4>
              <p className="text-xs text-green-700 mt-1">
                Children often express stress through physical complaints or
                behavior changes rather than words.
              </p>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg">
              <h4 className="font-medium text-orange-800 text-sm">
                Family Communication Growth
              </h4>
              <p className="text-xs text-orange-700 mt-1">
                Every family develops at their own pace. Focus on progress, not
                perfection, in communication skills.
              </p>
            </div>
          </div>
        </div>

        {/* Family Action Items */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3
            className="text-lg font-semibold text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Family Communication Goals
          </h3>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-green-800 text-sm">This Week</p>
                <p className="text-green-700 text-xs">
                  Practice daily emotional check-ins with your child
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-blue-800 text-sm">Ongoing</p>
                <p className="text-blue-700 text-xs">
                  Create consistent family conversation time without
                  distractions
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-purple-800 text-sm">If Needed</p>
                <p className="text-purple-700 text-xs">
                  Consider family communication support resources if challenges
                  persist
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
