"use client";

import {
  Brain,
  TrendingUp,
  Heart,
  Target,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  CheckCircle,
} from "lucide-react";

interface ChildMentalHealthDashboardProps {
  analyticsData: any;
  isLoading?: boolean;
  hasError?: boolean;
}

export default function ChildMentalHealthDashboard({
  analyticsData,
  isLoading = false,
  hasError = false,
}: ChildMentalHealthDashboardProps) {
  // Function to get appropriate icon for action plan steps
  const getStepIcon = (index: number) => {
    const icons = [Target, Calendar, MessageCircle, Users, CheckCircle, Clock];

    // Cycle through icons if there are more steps than icons
    const IconComponent = icons[index % icons.length];
    return IconComponent;
  };

  // Loading state - only show skeleton when actually loading
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="space-y-4 lg:space-y-6">
          {/* Loading skeleton for main sections */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 lg:p-6">
            <div className="animate-pulse">
              <div className="flex items-center mb-4 lg:mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="h-6 bg-gray-200 rounded w-full mb-4"></div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 lg:p-6"
            >
              <div className="animate-pulse">
                <div className="flex items-center mb-4 lg:mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex items-start space-x-4 p-5 bg-gray-50 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="">
        <div className="space-y-4 lg:space-y-6">
          {/* Top Section - Insight and Action Plan in One Row */}
          <div className="grid lg:grid-cols-1 gap-4 lg:gap-6">
            {/* This Week's Key Insight */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center mb-4 lg:mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h2
                  className="text-xl lg:text-2xl font-semibold text-gray-900"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  This Week's Key Insight
                </h2>
              </div>

              {analyticsData?.weekly_insight ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <p className="text-lg lg:text-xl leading-relaxed mb-6 text-gray-800">
                    {analyticsData.weekly_insight.story}
                  </p>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        What Happened
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {analyticsData.weekly_insight.what_happened}
                      </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-200">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        The Good News
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {analyticsData.weekly_insight.good_news}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4 text-lg font-medium">
                    Building your weekly insight...
                  </p>
                  <p className="text-gray-500 text-sm">
                    Have a few more conversations to see your personalized
                    family story here.
                  </p>
                </div>
              )}
            </div>

            {/* Action Plan */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center mb-4 lg:mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h2
                  className="text-xl lg:text-2xl font-semibold text-gray-900"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  Your Action Plan This Week
                </h2>
              </div>

              {analyticsData?.action_plan ? (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    {analyticsData.action_plan.steps?.map(
                      (step: any, index: number) => {
                        const IconComponent = getStepIcon(index);
                        return (
                          <div
                            key={index}
                            className="flex items-start space-x-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                          >
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg">
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-2 text-lg">
                                <span className="text-blue-600">
                                  {step.timeframe}:
                                </span>{" "}
                                {step.action}
                              </p>
                              <p className="text-gray-700 leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {analyticsData.action_plan.quick_win && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">⭐</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-800 mb-2 text-lg">
                            Quick Win:
                          </h3>
                          <p className="text-emerald-700 leading-relaxed">
                            {analyticsData.action_plan.quick_win}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2 text-lg font-medium">
                    Creating your action plan...
                  </p>
                  <p className="text-gray-500">
                    Continue conversations to receive personalized weekly action
                    steps.
                  </p>
                </div>
              )}
            </div>

            {/* Areas of Focus - Active Concerns */}
            {analyticsData?.active_concerns?.identified_concerns?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 lg:p-6">
                <div className="flex items-center mb-4 lg:mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h2
                    className="text-xl lg:text-2xl font-semibold text-gray-900"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Areas of Focus
                  </h2>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600 mb-6">
                    Based on recent conversations, here are some areas that may benefit from gentle attention and support.
                  </p>

                  <div className="grid gap-4">
                    {analyticsData.active_concerns.identified_concerns.map(
                      (concern: string, index: number) => {
                        const isPriority = analyticsData.active_concerns.priority_concerns?.includes(concern);
                        return (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border ${
                              isPriority 
                                ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' 
                                : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                isPriority ? 'bg-red-100' : 'bg-yellow-100'
                              }`}>
                                <span className={`text-xs font-bold ${
                                  isPriority ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {isPriority ? '!' : '•'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <p className={`font-medium ${
                                    isPriority ? 'text-red-800' : 'text-yellow-800'
                                  }`}>
                                    {concern}
                                  </p>
                                  {isPriority && (
                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                      Priority
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${
                                  isPriority ? 'text-red-700' : 'text-yellow-700'
                                }`}>
                                  {isPriority 
                                    ? "This area may benefit from focused attention and possibly professional guidance."
                                    : "Keep an eye on this area and continue providing supportive conversations."
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {analyticsData.active_concerns.priority_concerns?.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-blue-600">💡</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">Gentle Reminder</h4>
                          <p className="text-sm text-blue-700">
                            These observations are based on recent conversations and are meant to guide supportive discussions. 
                            Trust your parental instincts, and consider reaching out to a professional if you have ongoing concerns.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section - Progress Tracking */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center mb-4 lg:mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h2
                className="text-xl lg:text-2xl font-semibold text-gray-900"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Progress This Week
              </h2>
            </div>

            {analyticsData?.progress_tracking ? (
              <div className="space-y-6">
                {/* Wins and Still Working On in One Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Wins Section */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      Wins This Week
                    </h3>
                    <div className="space-y-3">
                      {analyticsData.progress_tracking.wins?.map(
                        (win: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm"
                          >
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm">✓</span>
                            </div>
                            <p className="text-green-800 font-medium leading-relaxed">
                              {win}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Still Working On Section */}
                  {analyticsData.progress_tracking.working_on &&
                    analyticsData.progress_tracking.working_on.length > 0 && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                          <span className="w-3 h-3 bg-amber-500 rounded-full mr-3"></span>
                          Still Working On
                        </h3>
                        <div className="space-y-3">
                          {analyticsData.progress_tracking.working_on.map(
                            (item: any, index: number) => (
                              <div
                                key={index}
                                className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 shadow-sm"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-sm">
                                      ⚠
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-amber-800 font-medium mb-2">
                                      {item.issue}
                                    </p>
                                    <p className="text-amber-700 text-sm leading-relaxed">
                                      {item.note}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* When to Worry Section */}
                {analyticsData.progress_tracking.when_to_worry && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm">!</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900 mb-3 text-lg">
                          When to Worry:
                        </h3>
                        <p className="text-blue-800 leading-relaxed">
                          {analyticsData.progress_tracking.when_to_worry}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2 text-lg font-medium">
                  Tracking your progress...
                </p>
                <p className="text-gray-500">
                  Continue having conversations to see your weekly progress
                  updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
