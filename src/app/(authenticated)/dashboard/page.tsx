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
  Calendar,
} from "lucide-react";
import ChildMentalHealthDashboard from "@/components/dashboard/child-mental-health-dashboard";
import { createClient } from "@/lib/supabase";
import { apiGet } from "@/lib/api";

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
  checkInStreak: {
    currentStreak: number;
    longestStreak: number;
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
  const { family, selectedChildId } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todaysMood: {
      status: "No data yet",
      trend: "Start first session",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    sessionsThisWeek: {
      count: 0,
      change: "No sessions yet",
    },
    checkInStreak: {
      currentStreak: 0,
      longestStreak: 0,
    },
    emotionalTrend: {
      status: "No data",
      attention: "Start your first session",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    activeConcerns: {
      count: 0,
      level: "No data yet",
    },
    hasAlert: false,
  });
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);
  const [hasAnalyticsError, setHasAnalyticsError] = useState<boolean>(false);

  useEffect(() => {
    if (family && selectedChildId) {
      // Clear previous child's data immediately when switching children
      setAnalyticsData(null);
      setIsLoadingAnalytics(true);
      setHasAnalyticsError(false);

      // Initial fetch
      fetchDashboardStats();

      // Set up real-time subscription for dashboard analytics updates
      const cleanup = setupRealTimeAnalyticsSubscription();

      // Cleanup subscription on unmount
      return () => {
        cleanup();
      };
    }
  }, [family, selectedChildId]);

  const fetchDashboardStats = async () => {
    if (!selectedChildId) return;

    setIsLoadingAnalytics(true);
    setHasAnalyticsError(false);

    try {
      // Fetch analytics through our API
      const response = await apiGet<{
        data: any;
        message?: string;
      }>(`analysis/dashboard-analytics?childId=${selectedChildId}`);

      const { data: fetchedAnalyticsData } = response;

      // Use the analytics data if available
      if (fetchedAnalyticsData) {
        setAnalyticsData(fetchedAnalyticsData);
        updateDashboardUI(fetchedAnalyticsData);
        setHasAnalyticsError(false);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);

      // Check if it's a 400 error (no data available) or other error
      if (error.message?.includes("400")) {
        // Reset dashboard to "no data" state when no analytics are available
        setAnalyticsData(null);
        setHasAnalyticsError(false); // 400 is not an error, just no data yet
      } else {
        // For other errors, set error state
        setAnalyticsData(null);
        setHasAnalyticsError(true);
      }

      // Reset to no data state on any error
      setDashboardStats({
        todaysMood: {
          status: "No data yet",
          trend: "Start first session",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        },
        sessionsThisWeek: {
          count: 0,
          change: "No sessions yet",
        },
        checkInStreak: {
          currentStreak: 0,
          longestStreak: 0,
        },
        emotionalTrend: {
          status: "No data",
          attention: "Start your first session",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        },
        activeConcerns: {
          count: 0,
          level: "No data yet",
        },
        hasAlert: false,
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const setupRealTimeAnalyticsSubscription = () => {
    const supabase = createClient();

    // Create unique channel name to prevent conflicts
    const channelId = `dashboard-analytics-${selectedChildId}-${Date.now()}`;

    const analyticsChannel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for INSERT, UPDATE, DELETE
          schema: "public",
          table: "dashboard_analytics",
          filter: `child_id=eq.${selectedChildId}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newAnalyticsData = payload.new;

            // Format confidence scores as percentages for dashboard display
            if (newAnalyticsData) {
              // Convert confidence_score to percentage if it exists
              if (
                newAnalyticsData.confidence_score !== null &&
                newAnalyticsData.confidence_score !== undefined
              ) {
                newAnalyticsData.confidence_score_percentage = Math.round(
                  newAnalyticsData.confidence_score * 100
                );
              }

              // Also convert any other confidence scores in nested objects
              if (
                newAnalyticsData.emotional_trend &&
                newAnalyticsData.emotional_trend.confidence_score
              ) {
                newAnalyticsData.emotional_trend.confidence_score_percentage =
                  Math.round(
                    newAnalyticsData.emotional_trend.confidence_score * 100
                  );
              }

              // Convert mood confidence scores
              if (
                newAnalyticsData.latest_mood &&
                newAnalyticsData.latest_mood.confidence_score
              ) {
                newAnalyticsData.latest_mood.confidence_score_percentage =
                  Math.round(
                    newAnalyticsData.latest_mood.confidence_score * 100
                  );
              }
            }

            // Update the dashboard UI with fresh data
            setAnalyticsData(newAnalyticsData);
            updateDashboardUI(newAnalyticsData);
          } else if (payload.eventType === "DELETE") {
            // Handle deletion by resetting to no data state
            setAnalyticsData(null);
            setDashboardStats({
              todaysMood: {
                status: "No data yet",
                trend: "Start first session",
                color: "text-gray-600",
                bgColor: "bg-gray-100",
              },
              sessionsThisWeek: {
                count: 0,
                change: "No sessions yet",
              },
              checkInStreak: {
                currentStreak: 0,
                longestStreak: 0,
              },
              emotionalTrend: {
                status: "No data",
                attention: "Start your first session",
                color: "text-gray-600",
                bgColor: "bg-gray-100",
              },
              activeConcerns: {
                count: 0,
                level: "No data yet",
              },
              hasAlert: false,
            });
          }
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      analyticsChannel.unsubscribe();
    };
  };

  const updateDashboardUI = (analyticsData: any) => {
    // Streak data is now stored inside sessions_analytics
    const streakData = analyticsData.sessions_analytics?.streak_analytics || {
      current_streak: 0,
      longest_streak: 0,
    };

    setDashboardStats({
      todaysMood: {
        status: analyticsData.latest_mood?.status || "No data yet",
        trend: analyticsData.latest_mood?.trend || "Start first session",
        color: getMoodColor(analyticsData.latest_mood?.status),
        bgColor: getMoodBgColor(analyticsData.latest_mood?.status),
      },
      sessionsThisWeek: {
        count: analyticsData.sessions_analytics?.sessions_this_week || 0,
        change: `${
          analyticsData.sessions_analytics?.sessions_this_week || 0
        } sessions this week`,
      },
      checkInStreak: {
        currentStreak: streakData.current_streak || 0,
        longestStreak: streakData.longest_streak || 0,
      },
      emotionalTrend: {
        status: analyticsData.emotional_trend?.status || "Baseline",
        attention: getEmotionalTrendAttention(
          analyticsData.emotional_trend?.status
        ),
        color: getEmotionalTrendColor(analyticsData.emotional_trend?.status),
        bgColor: getEmotionalTrendBgColor(
          analyticsData.emotional_trend?.status
        ),
      },
      activeConcerns: {
        count: analyticsData.active_concerns?.count || 0,
        level: getConcernLevel(analyticsData.active_concerns?.count || 0),
      },
      hasAlert: analyticsData.alerts?.has_alert || false,
      alertInfo: analyticsData.alerts?.has_alert
        ? {
            title: analyticsData.alerts.alert_title || "Alert",
            description: analyticsData.alerts.alert_description || "",
            level: analyticsData.alerts.alert_type || "warning",
          }
        : undefined,
    });
  };

  // Helper functions for UI colors and text
  const getMoodColor = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return "text-green-600";
      case "sad":
        return "text-blue-600";
      case "angry":
        return "text-red-600";
      case "anxious":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getMoodBgColor = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return "bg-green-100";
      case "sad":
        return "bg-blue-100";
      case "angry":
        return "bg-red-100";
      case "anxious":
        return "bg-yellow-100";
      default:
        return "bg-gray-100";
    }
  };

  const getEmotionalTrendColor = (trend: string) => {
    switch (trend) {
      case "Improving":
        return "text-green-600";
      case "Declining":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const getEmotionalTrendBgColor = (trend: string) => {
    switch (trend) {
      case "Improving":
        return "bg-green-100";
      case "Declining":
        return "bg-red-100";
      default:
        return "bg-blue-100";
    }
  };

  const getEmotionalTrendAttention = (trend: string) => {
    switch (trend) {
      case "Improving":
        return "Positive progress";
      case "Declining":
        return "Needs attention";
      default:
        return "Maintaining stability";
    }
  };

  const getConcernLevel = (count: number) => {
    if (count > 3) return "High priority";
    if (count > 1) return "Monitoring";
    return "Stable";
  };

  return (
    <>
      {/* Quick Stats - Now Dynamic */}
      <section className="px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Today's Mood */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
            {isLoadingAnalytics ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Latest Mood
                  </p>
                  <p
                    className={`text-xl font-semibold mt-1 capitalize ${dashboardStats.todaysMood.color}`}
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
            )}
          </div>

          {/* Session Count */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
            {isLoadingAnalytics ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-8 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Emotional Trend */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
            {isLoadingAnalytics ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-28"></div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Emotional Trend
                  </p>
                  <p
                    className={`text-xl font-semibold mt-1 capitalize ${dashboardStats.emotionalTrend.color}`}
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
                  {dashboardStats.emotionalTrend.status.includes("positive") ||
                  dashboardStats.emotionalTrend.status.includes("improving") ? (
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
            )}
          </div>

          {/* Active Concerns */}
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
            {isLoadingAnalytics ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-6 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Simple Streak Display */}
        {dashboardStats.checkInStreak.currentStreak > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">
                {dashboardStats.checkInStreak.currentStreak}-day check-in
                streak! Keep going! 🔥
              </span>
            </div>
          </div>
        )}

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
          <ChildMentalHealthDashboard
            analyticsData={analyticsData}
            isLoading={isLoadingAnalytics}
            hasError={hasAnalyticsError}
          />
        </Suspense>
      </section>
    </>
  );
}
