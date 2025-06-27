"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  TrendingDown,
  Heart,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";
import { ChildMentalHealthDashboard } from "@/components/dashboard/child-mental-health-dashboard";
import { ChildSelector } from "@/components/dashboard/child-selector";

interface DashboardStats {
  todaysMood: {
    status: string;
    trend: string;
    color: string;
    bgColor: string;
  };
  sessionsThisWeek: {
    count: number;
    change: string;
  };
  emotionalTrend: {
    status: string;
    attention: string;
    color: string;
    bgColor: string;
  };
  activeConcerns: {
    count: number;
    level: string;
  };
  hasAlert: boolean;
  alertInfo?: {
    title: string;
    description: string;
    level: string;
  };
}

export default function ParentDashboard() {
  const router = useRouter();
  const { family, selectedChildId, setSelectedChildId } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todaysMood: {
      status: "Loading...",
      trend: "Analyzing data",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    sessionsThisWeek: {
      count: 0,
      change: "Loading...",
    },
    emotionalTrend: {
      status: "Processing",
      attention: "Gathering insights",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    activeConcerns: {
      count: 0,
      level: "Analyzing",
    },
    hasAlert: false,
  });

  // Check if user has set up their PIN
  useEffect(() => {
    const checkPinSetup = async () => {
      try {
        const response = await fetch("/api/auth/pin");
        if (response.status === 404) {
          // PIN not set up, redirect to PIN setup
          router.push("/pin-setup");
        }
      } catch (error) {
        console.error("Error checking PIN setup:", error);
      }
    };

    checkPinSetup();
  }, [router]);

  useEffect(() => {
    if (family && selectedChildId) {
      fetchDashboardStats();
    }
  }, [family, selectedChildId]);

  const fetchDashboardStats = async () => {
    if (!selectedChildId) return;

    try {
      // Fetch recent therapy sessions for selected child
      const sessionsResponse = await fetch(
        `/api/sessions?limit=50&childId=${selectedChildId}`
      );
      if (!sessionsResponse.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const sessionsData = await sessionsResponse.json();
      const sessions = sessionsData.sessions || [];

      if (sessions.length === 0) {
        setDashboardStats({
          todaysMood: {
            status: "No data yet",
            trend: "Start first session",
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          sessionsThisWeek: {
            count: 0,
            change: "Ready to begin",
          },
          emotionalTrend: {
            status: "Baseline",
            attention: "No sessions yet",
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          activeConcerns: {
            count: 0,
            level: "None identified",
          },
          hasAlert: false,
        });
        return;
      }

      // Analyze recent data
      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Sessions this week
      const sessionsThisWeek = sessions.filter(
        (session: any) => new Date(session.created_at) >= oneWeekAgo
      );

      // Recent mood analysis (last 3 sessions)
      const recentSessions = sessions.slice(0, 3);
      const moodAnalysis = analyzeMoodTrends(recentSessions);

      // Check for concerning patterns
      const concerns = identifyConcerns(sessions);
      const hasAlert = concerns.high > 0 || concerns.medium > 2;

      // Generate alert if needed
      let alertInfo = undefined;
      if (hasAlert) {
        alertInfo = generateAlert(recentSessions, concerns);
      }

      setDashboardStats({
        todaysMood: moodAnalysis.todaysMood,
        sessionsThisWeek: {
          count: sessionsThisWeek.length,
          change: generateSessionTrend(sessions, oneWeekAgo),
        },
        emotionalTrend: moodAnalysis.emotionalTrend,
        activeConcerns: {
          count: concerns.high + concerns.medium,
          level:
            concerns.high > 0
              ? "High priority"
              : concerns.medium > 0
              ? "Monitoring"
              : "Stable",
        },
        hasAlert,
        alertInfo,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Keep loading state if there's an error
    }
  };

  const analyzeMoodTrends = (recentSessions: any[]) => {
    if (recentSessions.length === 0) {
      return {
        todaysMood: {
          status: "No data yet",
          trend: "Start first session",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        },
        emotionalTrend: {
          status: "No sessions",
          attention: "Begin tracking",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        },
      };
    }

    // Analyze most recent session mood
    const latestSession = recentSessions[0];
    const mood = latestSession.mood_analysis;

    if (!mood) {
      return {
        todaysMood: {
          status: "Processing...",
          trend: "Analysis in progress",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        },
        emotionalTrend: {
          status: "Processing",
          attention: "Analyzing patterns",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        },
      };
    }

    // Determine current mood status with more nuanced logic
    const avgAnxiety = mood.anxiety || 0;
    const avgSadness = mood.sadness || 0;
    const avgStress = mood.stress || 0;
    const avgHappiness = mood.happiness || 0;

    let currentMoodStatus = "Stable";
    let moodColor = "text-green-600";
    let moodBgColor = "bg-green-100";

    // More nuanced mood assessment
    if (avgAnxiety >= 8 || avgSadness >= 8 || avgStress >= 8) {
      currentMoodStatus = "Needs attention";
      moodColor = "text-red-600";
      moodBgColor = "bg-red-100";
    } else if (avgAnxiety >= 6 || avgSadness >= 6 || avgStress >= 6) {
      currentMoodStatus = "Concerned";
      moodColor = "text-orange-600";
      moodBgColor = "bg-orange-100";
    } else if (
      avgHappiness >= 7 &&
      avgAnxiety <= 4 &&
      avgSadness <= 4 &&
      avgStress <= 4
    ) {
      currentMoodStatus = "Positive";
      moodColor = "text-green-600";
      moodBgColor = "bg-green-100";
    } else if (avgHappiness >= 6) {
      currentMoodStatus = "Good";
      moodColor = "text-blue-600";
      moodBgColor = "bg-blue-100";
    }

    // Calculate trend (compare to previous sessions)
    let trend = "";
    if (recentSessions.length >= 2) {
      // Calculate trend over the last 3 sessions for more accuracy
      const sessionsToAnalyze = recentSessions.slice(
        0,
        Math.min(3, recentSessions.length)
      );

      // Calculate average emotional scores for each session
      const emotionalScores = sessionsToAnalyze
        .map((session) => {
          const mood = session.mood_analysis;
          if (!mood) return null;
          // Weighted average: happiness positive, others negative
          return (
            (mood.happiness || 0) -
            ((mood.anxiety || 0) + (mood.sadness || 0) + (mood.stress || 0)) / 3
          );
        })
        .filter((score) => score !== null);

      if (emotionalScores.length >= 2) {
        const recentScore = emotionalScores[0];
        const previousScore = emotionalScores[1];

        if (recentScore > previousScore + 1) {
          trend = "Improving";
        } else if (recentScore < previousScore - 1) {
          trend = "Declining";
        } else {
          trend = "Stable";
        }
      }
    }

    // Determine emotional trend status with better logic
    let emotionalStatus = "Stable";
    let emotionalColor = "text-green-600";
    let emotionalBgColor = "bg-green-100";
    let attention = "Continue monitoring";

    if (currentMoodStatus === "Needs attention") {
      emotionalStatus = "High concern";
      emotionalColor = "text-red-600";
      emotionalBgColor = "bg-red-100";
      attention = "Immediate attention recommended";
    } else if (currentMoodStatus === "Concerned") {
      emotionalStatus = "Moderate concern";
      emotionalColor = "text-orange-600";
      emotionalBgColor = "bg-orange-100";
      attention = "Increased monitoring advised";
    } else if (trend === "Improving" || currentMoodStatus === "Positive") {
      emotionalStatus = "Positive trend";
      emotionalColor = "text-green-600";
      emotionalBgColor = "bg-green-100";
      attention = "Great progress!";
    } else if (currentMoodStatus === "Good") {
      emotionalStatus = "Good";
      emotionalColor = "text-blue-600";
      emotionalBgColor = "bg-blue-100";
      attention = "Maintain current approach";
    }

    return {
      todaysMood: {
        status: currentMoodStatus,
        trend,
        color: moodColor,
        bgColor: moodBgColor,
      },
      emotionalTrend: {
        status: emotionalStatus,
        attention,
        color: emotionalColor,
        bgColor: emotionalBgColor,
      },
    };
  };

  const identifyConcerns = (sessions: any[]) => {
    const concerns = { high: 0, medium: 0, low: 0 };

    sessions.forEach((session) => {
      const mood = session.mood_analysis;
      if (!mood) return;

      const avgAnxiety = mood.anxiety || 0;
      const avgSadness = mood.sadness || 0;
      const avgStress = mood.stress || 0;

      // More nuanced concern levels
      if (avgAnxiety >= 8 || avgSadness >= 8 || avgStress >= 8) {
        concerns.high++;
      } else if (avgAnxiety >= 6 || avgSadness >= 6 || avgStress >= 6) {
        concerns.medium++;
      } else {
        concerns.low++;
      }
    });

    return concerns;
  };

  const generateSessionTrend = (sessions: any[], oneWeekAgo: Date) => {
    const twoWeeksAgo = new Date(
      oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const thisWeek = sessions.filter(
      (session) => new Date(session.created_at) >= oneWeekAgo
    );
    const lastWeek = sessions.filter(
      (session) =>
        new Date(session.created_at) >= twoWeeksAgo &&
        new Date(session.created_at) < oneWeekAgo
    );

    if (lastWeek.length === 0) {
      if (thisWeek.length === 0) {
        return "No sessions yet";
      } else if (thisWeek.length === 1) {
        return "First session this week";
      } else {
        return `${thisWeek.length} sessions this week`;
      }
    }

    const change = thisWeek.length - lastWeek.length;
    if (change > 0) {
      return `+${change} more than last week`;
    } else if (change < 0) {
      return `${Math.abs(change)} fewer than last week`;
    } else {
      return "Same as last week";
    }
  };

  const generateAlert = (recentSessions: any[], concerns: any) => {
    if (concerns.high > 0) {
      return {
        title: "High Priority Alert",
        description:
          "Multiple concerning patterns detected. Consider professional consultation.",
        level: "high",
      };
    } else if (concerns.medium > 2) {
      return {
        title: "Moderate Concern",
        description:
          "Several sessions show elevated stress levels. Monitor closely.",
        level: "medium",
      };
    }
    return undefined;
  };

  return (
    <>
      {/* Quick Stats - Now Dynamic */}
      <section className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Mood */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Latest Mood
                </p>
                <p
                  className={`text-xl font-semibold mt-1 ${dashboardStats.todaysMood.color}`}
                >
                  {dashboardStats.todaysMood.status}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardStats.todaysMood.trend}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${dashboardStats.todaysMood.bgColor} rounded-lg flex items-center justify-center`}
              >
                <Heart
                  className={`h-5 w-5 ${dashboardStats.todaysMood.color}`}
                />
              </div>
            </div>
          </div>

          {/* Session Count */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Sessions This Week
                </p>
                <p className="text-xl font-semibold text-blue-600 mt-1">
                  {dashboardStats.sessionsThisWeek.count}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardStats.sessionsThisWeek.change}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Emotional Trend */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Emotional Trend
                </p>
                <p
                  className={`text-xl font-semibold mt-1 ${dashboardStats.emotionalTrend.color}`}
                >
                  {dashboardStats.emotionalTrend.status}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardStats.emotionalTrend.attention}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${dashboardStats.emotionalTrend.bgColor} rounded-lg flex items-center justify-center`}
              >
                {dashboardStats.emotionalTrend.status.includes("Positive") ||
                dashboardStats.emotionalTrend.status.includes("Improving") ? (
                  <TrendingUp
                    className={`h-5 w-5 ${dashboardStats.emotionalTrend.color}`}
                  />
                ) : (
                  <TrendingDown
                    className={`h-5 w-5 ${dashboardStats.emotionalTrend.color}`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Active Concerns */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Active Concerns
                </p>
                <p className="text-xl font-semibold text-purple-600 mt-1">
                  {dashboardStats.activeConcerns.count}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardStats.activeConcerns.level}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Alert Banner - Dynamic */}
        {dashboardStats.hasAlert && dashboardStats.alertInfo && (
          <div
            className={`rounded-xl shadow-sm p-4 border mb-6 flex items-start space-x-3 ${
              dashboardStats.alertInfo.level === "high"
                ? "bg-red-50 border-red-200"
                : "bg-orange-50 border-orange-200"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                dashboardStats.alertInfo.level === "high"
                  ? "bg-red-100"
                  : "bg-orange-100"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 ${
                  dashboardStats.alertInfo.level === "high"
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3
                className={`text-base font-semibold mb-1 ${
                  dashboardStats.alertInfo.level === "high"
                    ? "text-red-800"
                    : "text-orange-800"
                }`}
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                {dashboardStats.alertInfo.title}
              </h3>
              <p
                className={`text-sm ${
                  dashboardStats.alertInfo.level === "high"
                    ? "text-red-700"
                    : "text-orange-700"
                }`}
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {dashboardStats.alertInfo.description}
              </p>
            </div>
          </div>
        )}

        {/* Main Dashboard Component */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Loading skeletons */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <ChildMentalHealthDashboard selectedChildId={selectedChildId} />
        </Suspense>
      </section>
    </>
  );
}
