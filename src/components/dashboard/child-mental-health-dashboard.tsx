"use client";

import { useState, useEffect } from "react";
import { Brain, TrendingUp } from "lucide-react";
import { formatSessionDuration } from "@/lib/utils";

interface Session {
  id: string;
  childId: string;
  startTime: string;
  endTime: string;
  duration: number;
  moodAnalysis: {
    happiness: number;
    anxiety: number;
    sadness: number;
    stress: number;
    confidence: number;
    insights: string;
  };
  keyTopics: string[];
  summary: string;
}

function getMoodFromAnalysis(moodAnalysis: Session["moodAnalysis"]): string {
  if (moodAnalysis.anxiety >= 7) return "Anxious";
  if (moodAnalysis.sadness >= 7) return "Sad";
  if (moodAnalysis.happiness >= 7) return "Happy";
  if (moodAnalysis.stress >= 7) return "Stressed";
  return "Neutral";
}

export function ChildMentalHealthDashboard({
  selectedChildId,
  analyticsData,
}: {
  selectedChildId?: string;
  analyticsData?: any;
}) {
  const [expandedPatterns, setExpandedPatterns] = useState<
    Record<string, boolean>
  >({});
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const togglePattern = (topic: string) => {
    setExpandedPatterns((prev) => {
      // If this pattern is already expanded, close it
      if (prev[topic]) {
        return {
          ...prev,
          [topic]: false,
        };
      }
      // If another pattern is expanded, close it and open this one
      return {
        // Reset all patterns to false
        ...Object.keys(prev).reduce(
          (acc, key) => ({ ...acc, [key]: false }),
          {}
        ),
        // Set the clicked pattern to true
        [topic]: true,
      };
    });
  };

  useEffect(() => {
    async function fetchSessions() {
      if (!selectedChildId) return;

      setIsLoadingSessions(true);
      try {
        const response = await fetch(
          `/api/chat/sessions?childId=${selectedChildId}&pageSize=5`
        );
        if (!response.ok) throw new Error("Failed to fetch sessions");

        const data = await response.json();
        setRecentSessions(data.sessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoadingSessions(false);
      }
    }

    fetchSessions();
  }, [selectedChildId]);

  // Loading state
  if (isLoadingSessions) {
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
          </div>

          <div className="space-y-6">
            {analyticsData?.communication_insights &&
            analyticsData?.communication_insights.length > 0 ? (
              analyticsData?.communication_insights.map((pattern: any) => (
                <div
                  key={pattern.topic}
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {pattern.topic}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-32">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${pattern.confidence_score}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {pattern.confidence_score}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePattern(pattern.topic)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {expandedPatterns[pattern.topic]
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                  </div>

                  {expandedPatterns[pattern.topic] && (
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
                                <span className="text-blue-500">•</span>
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
                          {pattern.parent_insights?.map(
                            (insight: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-purple-700 flex items-start space-x-2"
                              >
                                <span className="text-purple-500">?</span>
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
                          {Array.isArray(pattern.communication_tips) ? (
                            <ul className="space-y-1">
                              {pattern.communication_tips.map(
                                (tip: string, index: number) => (
                                  <li key={index}>• {tip}</li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p>{pattern.communication_tips}</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-1">
                          Recommended Next Step:
                        </h4>
                        <p className="text-sm text-green-800">
                          {pattern.recommended_next_step || pattern.next_steps}
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
            {analyticsData?.growth_development_insights &&
            analyticsData?.growth_development_insights.length > 0 ? (
              analyticsData?.growth_development_insights.map(
                (benefit: any, index: number) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-400 pl-6 py-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {benefit.category}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700`}
                      >
                        {benefit.insight_summary}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {benefit.insight_detail}
                    </p>

                    <div className="space-y-2">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          Suggested Actions:
                        </p>
                        <div className="text-sm text-green-800">
                          {Array.isArray(benefit.suggested_actions) ? (
                            <ul className="space-y-1">
                              {benefit.suggested_actions.map(
                                (action: string, actionIndex: number) => (
                                  <li key={actionIndex}>• {action}</li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p>{benefit.suggested_actions}</p>
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
            {isLoadingSessions ? (
              // Loading skeleton
              Array(3)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                        <div className="flex gap-1">
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))
            ) : recentSessions.length > 0 ? (
              recentSessions.map((session) => {
                const startDate = new Date(session.startTime);
                const mood = getMoodFromAnalysis(session.moodAnalysis);

                return (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          {startDate.toLocaleDateString()} at{" "}
                          {startDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatSessionDuration(session.duration)}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          mood === "Anxious"
                            ? "bg-red-100 text-red-700"
                            : mood === "Sad"
                            ? "bg-blue-100 text-blue-700"
                            : mood === "Happy"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {mood}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Key Themes:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {session.keyTopics.map(
                            (topic: string, topicIndex: number) => (
                              <span
                                key={topicIndex}
                                className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs"
                              >
                                {topic}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Clinical Notes:
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {session.moodAnalysis.insights}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent conversations found.</p>
              </div>
            )}
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
            {analyticsData?.family_communication_summary ? (
              <>
                <div>
                  <h4 className="font-medium text-green-800 mb-2">
                    Communication Strengths:
                  </h4>
                  <ul className="space-y-1">
                    {analyticsData?.family_communication_summary.strengths?.map(
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
                    {analyticsData?.family_communication_summary.growth_areas?.map(
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
                    {analyticsData?.family_communication_summary.recommendations?.map(
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
            {analyticsData?.conversation_organization ? (
              <>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">
                    Key Conversation Topics:
                  </h4>
                  <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                    {analyticsData?.conversation_organization?.key_topics?.map(
                      (topic: string, index: number) => (
                        <li key={index}>{topic}</li>
                      )
                    )}
                  </ol>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">
                    Questions to Consider:
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    {analyticsData?.conversation_organization?.questions_to_consider?.map(
                      (question: string, index: number) => (
                        <li key={index}>• {question}</li>
                      )
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <Brain size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">
                    Conversation Planning Coming Soon
                  </p>
                  <p className="text-sm">
                    Complete more therapy sessions to receive professional
                    conversation guidance.
                  </p>
                </div>
              </div>
            )}
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
            {analyticsData?.family_wellness_tips &&
            analyticsData?.family_wellness_tips.length > 0 ? (
              analyticsData?.family_wellness_tips?.map(
                (tip: any, index: number) => (
                  <div
                    key={index}
                    className={`bg-${tip.color || "blue"}-50 p-3 rounded-lg`}
                  >
                    <h4
                      className={`font-medium text-${
                        tip.color || "blue"
                      }-800 text-sm`}
                    >
                      {tip.title}
                    </h4>
                    <p
                      className={`text-xs text-${tip.color || "blue"}-700 mt-1`}
                    >
                      {tip.description}
                    </p>
                  </div>
                )
              )
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">
                    Wellness Tips Coming Soon
                  </p>
                  <p className="text-sm">
                    Continue your therapy journey to receive personalized
                    wellness tips.
                  </p>
                </div>
              </div>
            )}
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
            {analyticsData?.family_communication_goals &&
            analyticsData?.family_communication_goals.length > 0 ? (
              analyticsData?.family_communication_goals?.map(
                (goal: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 p-3 bg-${
                      goal.color || "green"
                    }-50 rounded-lg border-l-4 border-${
                      goal.color || "green"
                    }-400`}
                  >
                    <div
                      className={`flex-shrink-0 w-2 h-2 bg-${
                        goal.color || "green"
                      }-500 rounded-full mt-2`}
                    ></div>
                    <div>
                      <p
                        className={`font-medium text-${
                          goal.color || "green"
                        }-800 text-sm`}
                      >
                        {goal.goal_type}
                      </p>
                      <p
                        className={`text-${goal.color || "green"}-700 text-xs`}
                      >
                        {goal.description}
                      </p>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <Brain size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">
                    Communication Goals Pending
                  </p>
                  <p className="text-sm">
                    Complete more sessions to receive personalized family
                    communication goals.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
