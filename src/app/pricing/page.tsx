"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Check,
  MessageCircle,
  Users,
  BarChart3,
  Heart,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isTrialing: boolean;
  isPaidSubscription: boolean;
  trialEnded: boolean;
  subscriptionStatus: string;
  currentPeriodEnd?: Date;
}

export default function PricingPage() {
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      // First check if user is authenticated
      const authResponse = await fetch("/api/auth/me");
      if (!authResponse.ok) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Check subscription status
      const response = await fetch("/api/stripe/subscription-status");
      if (response.ok) {
        const data = await response.json();

        // Map the response to our interface
        const status: SubscriptionStatus = {
          hasActiveSubscription:
            data.hasSubscription &&
            data.family.subscription_status === "active",
          isTrialing: data.family.subscription_status === "trialing",
          isPaidSubscription:
            data.hasSubscription &&
            data.family.subscription_status === "active",
          trialEnded: data.family.trial_ends_at
            ? new Date(data.family.trial_ends_at) < new Date()
            : false,
          subscriptionStatus: data.family.subscription_status || "inactive",
          currentPeriodEnd: data.subscription?.current_period_end
            ? new Date(data.subscription.current_period_end * 1000)
            : undefined,
        };

        setSubscriptionStatus(status);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (!isAuthenticated) {
      return "Start Your Free Trial";
    }

    if (!subscriptionStatus) {
      return "Subscribe Now";
    }

    // If user has an active subscription
    if (subscriptionStatus.hasActiveSubscription) {
      return "Manage Subscription";
    }

    // If user is trialing
    if (subscriptionStatus.isTrialing) {
      return "Manage Subscription";
    }

    // If trial ended or subscription was canceled
    if (
      subscriptionStatus.trialEnded ||
      subscriptionStatus.subscriptionStatus === "canceled"
    ) {
      return "Subscribe Now";
    }

    // Default case - probably new user
    return "Start Your Free Trial";
  };

  const getButtonLink = () => {
    if (!isAuthenticated) {
      return "/auth/register";
    }

    if (!subscriptionStatus) {
      return "/auth/register";
    }

    // If user has active subscription or is trialing, go to profile management
    if (
      subscriptionStatus.hasActiveSubscription ||
      subscriptionStatus.isTrialing
    ) {
      return "/profile";
    }

    // If trial ended or canceled, go to resubscribe page for existing users
    return "/resubscribe";
  };

  const getTrialText = () => {
    if (!isAuthenticated) {
      return "No credit card required for trial";
    }

    if (!subscriptionStatus) {
      return "No credit card required for trial";
    }

    if (
      subscriptionStatus.trialEnded ||
      subscriptionStatus.subscriptionStatus === "canceled"
    ) {
      return "Restart your family communication journey";
    }

    if (subscriptionStatus.isTrialing) {
      return "Currently in free trial";
    }

    if (subscriptionStatus.hasActiveSubscription) {
      return "Active subscription";
    }

    return "No credit card required for trial";
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lily Heart</h1>
                <p className="text-sm text-gray-600">
                  Family Communication Coach
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No decision fatigue. No hidden costs. Everything your family needs
            to build better communication.
          </p>
        </div>

        {/* Single Plan */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Plan Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">
                Family Communication Coach
              </h2>
              <p className="text-purple-100 mb-6">
                Everything your family needs to thrive
              </p>
              <div className="flex items-baseline justify-center space-x-2">
                <span className="text-5xl font-bold">$39</span>
                <span className="text-purple-200 text-lg">/month</span>
              </div>
              <p className="text-purple-100 text-sm mt-2">
                Cancel anytime • 7-day free trial
              </p>
            </div>

            {/* Features */}
            <div className="p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Unlimited AI Conversations
                    </p>
                    <p className="text-sm text-gray-600">
                      24/7 emotional support for up to 4 family members
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Parent Dashboard
                    </p>
                    <p className="text-sm text-gray-600">
                      Real-time insights into family communication patterns
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Appointment Preparation Tools
                    </p>
                    <p className="text-sm text-gray-600">
                      Organize thoughts and progress for healthcare visits
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Family Progress Tracking
                    </p>
                    <p className="text-sm text-gray-600">
                      Monitor communication growth and emotional wellness
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Age-Appropriate AI Coaching
                    </p>
                    <p className="text-sm text-gray-600">
                      Tailored conversations for children ages 3-18
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Crisis Support Resources
                    </p>
                    <p className="text-sm text-gray-600">
                      Immediate guidance and professional referrals when needed
                    </p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="w-full bg-gray-400 text-white px-6 py-4 rounded-lg font-medium flex items-center justify-center space-x-2 text-center cursor-not-allowed">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <Link
                  href={getButtonLink()}
                  className="w-full bg-purple-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 text-center"
                >
                  <span>{getButtonText()}</span>
                </Link>
              )}

              <p className="text-center text-gray-500 text-sm mt-4">
                {getTrialText()}
              </p>
            </div>
          </div>
        </div>

        {/* Why One Plan? */}
        <div className="mt-16 bg-white rounded-xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why One Simple Plan?
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                No Decision Fatigue
              </h4>
              <p className="text-gray-600">
                When your family needs support, the last thing you need is
                complicated pricing tiers. One plan gives you everything,
                immediately.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Complete Family Coverage
              </h4>
              <p className="text-gray-600">
                Every feature included from day one. No upgrades needed as your
                family grows or your communication needs evolve.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
            <p className="text-gray-600">
              Dr. Emma is always available when your family needs emotional
              support or communication guidance.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Progress Insights
            </h3>
            <p className="text-gray-600">
              Track your family's communication growth with detailed analytics
              and professional-grade reports.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Whole Family</h3>
            <p className="text-gray-600">
              Support for up to 4 children with age-appropriate conversations
              and personalized coaching.
            </p>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Family Communication?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of families who have improved their emotional
            connections and communication with Lily Heart's Family Communication
            Coach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoading ? (
              <div className="bg-gray-400 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 cursor-not-allowed">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <Link
                href={getButtonLink()}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                {getButtonText()}
              </Link>
            )}
            <Link
              href="/auth/login"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium border border-purple-600 hover:bg-purple-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
