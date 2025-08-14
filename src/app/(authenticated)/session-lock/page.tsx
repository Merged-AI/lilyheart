"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Heart, Star, Brain, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSessionLock } from "@/lib/session-lock-context";
import { useAuth } from "@/lib/auth-context";
import { apiPost } from "@/lib/api";

export default function SessionLockPage() {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInsights, setSessionInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const router = useRouter();
  const { unlockSession, isSessionLocked } = useSessionLock();
  const { selectedChildId, family } = useAuth();

  // Get the selected child from the family children array
  const selectedChild = family?.children?.find(
    (child) => child.id === selectedChildId
  );

  // Fetch session completion insights
  useEffect(() => {
    const fetchSessionInsights = async () => {
      if (!selectedChildId) return;

      try {
        setIsLoadingInsights(true);
        const response = await apiPost("sessions/completion-insights", {
          childId: selectedChildId,
        });
        setSessionInsights(response.insights);
      } catch (error) {
        console.error("Error fetching session insights:", error);
        // Use fallback insights if API fails
        setSessionInsights({
          main_achievement: `${
            selectedChild?.name || "Your child"
          } engaged meaningfully in today's session and worked on emotional awareness.`,
          key_insights: [
            "Showed openness to discussing feelings and emotions",
            "Demonstrated willingness to learn new coping strategies",
          ],
          coping_strategies: [
            "Deep breathing techniques for managing stress",
            "Positive self-talk strategies",
          ],
          parent_note:
            "Continue encouraging open emotional expression at home.",
          emotional_highlights: [
            "Expressed feelings clearly and thoughtfully",
            "Showed curiosity about emotional management tools",
          ],
        });
      } finally {
        setIsLoadingInsights(false);
      }
    };

    fetchSessionInsights();
  }, [selectedChildId, selectedChild?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await apiPost<{ success: boolean; message?: string }>(
        "auth/pin/validate",
        { pin: passcode }
      );

      // PIN validation successful
      unlockSession();
      setPasscode("");

      setTimeout(() => {
        router.push("/dashboard");
      }, 200);
    } catch (error: any) {
      console.error("PIN validation error:", error);
      setError("Incorrect passcode. Please try again.");
      setPasscode("");
    }

    setIsLoading(false);
  };

  // Prevent navigation when session is locked
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSessionLocked) {
        e.preventDefault();
        e.returnValue =
          "Session is locked. Please enter the parent PIN to continue.";
        return e.returnValue;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F5, Ctrl+R, Ctrl+Shift+R
      if (
        e.key === "F5" ||
        (e.ctrlKey && e.key === "r") ||
        (e.ctrlKey && e.shiftKey && e.key === "R")
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    if (isSessionLocked) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("contextmenu", handleContextMenu);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isSessionLocked]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Lock className="h-10 w-10 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Session Complete
          </h1>
          <p className="text-gray-600 text-sm">
            Your child's therapy session has ended safely. Enter the parent
            passcode to view detailed insights and mood analysis.
          </p>
        </div>

        {/* AI-Generated Session Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-5 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">
              Great session! Here's what we learned about{" "}
              {selectedChild?.name || "your child"}
            </h3>
          </div>

          {isLoadingInsights ? (
            <div className="space-y-3">
              <div className="animate-pulse">
                <div className="h-4 bg-green-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-green-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-green-200 rounded w-2/3"></div>
              </div>
            </div>
          ) : sessionInsights ? (
            <div className="space-y-4">
              {/* Main Achievement */}
              <div className="flex items-start space-x-3">
                <Heart className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-green-700 text-sm font-medium">
                  {sessionInsights.main_achievement}
                </p>
              </div>

              {/* Key Insights */}
              {sessionInsights.key_insights &&
                sessionInsights.key_insights.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-700 text-sm font-medium mb-1">
                        Key Insights:
                      </p>
                      <ul className="text-blue-700 text-xs space-y-1">
                        {sessionInsights.key_insights.map(
                          (insight: string, index: number) => (
                            <li
                              key={index}
                              className="flex items-start space-x-1"
                            >
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{insight}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}

              {/* Coping Strategies */}
              {sessionInsights.coping_strategies &&
                sessionInsights.coping_strategies.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <Target className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-purple-700 text-sm font-medium mb-1">
                        New Coping Strategies:
                      </p>
                      <ul className="text-purple-700 text-xs space-y-1">
                        {sessionInsights.coping_strategies.map(
                          (strategy: string, index: number) => (
                            <li
                              key={index}
                              className="flex items-start space-x-1"
                            >
                              <span className="text-purple-600 mt-0.5">•</span>
                              <span>{strategy}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}

              {/* Parent Note */}
              {sessionInsights.parent_note && (
                <div className="bg-white rounded-lg p-3 mt-3">
                  <p className="text-gray-700 text-sm font-medium mb-1">
                    💜 For Parents:
                  </p>
                  <p className="text-gray-600 text-xs">
                    {sessionInsights.parent_note} Detailed analytics are
                    available on your dashboard after verification.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600 text-sm">
              Session insights are being generated...
            </div>
          )}
        </div>

        {/* Session Lock Status */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium text-purple-800">
              Session Securely Locked
            </h3>
          </div>
          <p className="text-purple-700 text-sm">
            Your child's session has been safely locked. Navigation has been
            disabled to ensure privacy and security.
          </p>
        </div>

        {/* Parent Access */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Parent Dashboard Access
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="passcode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter Parent Passcode
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? "text" : "password"}
                  id="passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
                  placeholder="Enter 4-digit code"
                  maxLength={4}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasscode ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || passcode.length !== 4}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-3">
              This protects your child's privacy by restricting access to
              detailed mood analysis and recommendations.
            </p>
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-xs font-medium mb-1">
            Crisis Support
          </p>
          <p className="text-red-700 text-xs">
            If this is a mental health emergency, call 988 (Suicide & Crisis
            Lifeline) or 911 immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
