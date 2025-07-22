"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Lock,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ReactNode;
  redirectOnDenied?: boolean;
}

interface SubscriptionStatus {
  hasAccess: boolean;
  isTrialing: boolean;
  isPaidSubscription: boolean;
  trialEnded: boolean;
  subscriptionStatus: string;
  message?: string;
}

export default function SubscriptionGuard({
  children,
  feature,
  fallback,
  redirectOnDenied = false,
}: SubscriptionGuardProps) {
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [feature]);

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/stripe/subscription-status");

      if (response.ok) {
        const data = await response.json();
        const hasAccess =
          data.hasSubscription &&
          (data.family.subscription_status === "active" ||
            data.family.subscription_status === "trialing" ||
            (data.family.subscription_status === "canceled" &&
              data.subscription?.current_period_end &&
              new Date(data.subscription.current_period_end * 1000) >
                new Date()) ||
            (data.family.subscription_canceled_at &&
              data.subscription?.current_period_end &&
              new Date(data.subscription.current_period_end * 1000) >
                new Date()));

        setSubscriptionStatus({
          hasAccess,
          isTrialing: data.family.subscription_status === "trialing",
          isPaidSubscription: data.family.subscription_status === "active",
          trialEnded:
            data.family.trial_ends_at &&
            new Date(data.family.trial_ends_at) <= new Date(),
          subscriptionStatus: data.family.subscription_status || "inactive",
        });
      } else {
        setSubscriptionStatus({
          hasAccess: false,
          isTrialing: false,
          isPaidSubscription: false,
          trialEnded: true,
          subscriptionStatus: "error",
        });
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setSubscriptionStatus({
        hasAccess: false,
        isTrialing: false,
        isPaidSubscription: false,
        trialEnded: true,
        subscriptionStatus: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const getFeatureDisplayName = (feature: string) => {
    const featureNames: { [key: string]: string } = {
      chat_sessions: "Chat Sessions",
      voice_chat: "Voice Chat",
      advanced_analytics: "Advanced Analytics",
      mood_tracking: "Mood Tracking",
      enhanced_analysis: "Enhanced Analysis",
      multiple_children: "Multiple Children",
      unlimited_sessions: "Unlimited Sessions",
    };
    return featureNames[feature] || "Premium Feature";
  };

  const getStatusMessage = () => {
    if (!subscriptionStatus) return null;

    if (
      subscriptionStatus.trialEnded &&
      !subscriptionStatus.isPaidSubscription
    ) {
      return {
        title: "Free Trial Ended",
        message:
          "Your free trial has expired. Subscribe now to continue using premium features.",
        icon: Clock,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      };
    }

    if (subscriptionStatus.subscriptionStatus === "canceled") {
      return {
        title: "Subscription Canceled",
        message:
          "Your subscription has been canceled. Subscribe again to regain access to premium features.",
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      };
    }

    return {
      title: "Premium Feature",
      message:
        "This feature requires an active subscription. Start your free trial to unlock it.",
      icon: Lock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Checking access...</span>
      </div>
    );
  }

  if (subscriptionStatus?.hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (redirectOnDenied) {
    router.push("/pricing");
    return null;
  }

  const statusInfo = getStatusMessage();
  const StatusIcon = statusInfo?.icon || Lock;

  return (
    <div
      className={`rounded-xl border-2 ${statusInfo?.borderColor} ${statusInfo?.bgColor} p-8 text-center`}
    >
      <div
        className={`w-16 h-16 ${statusInfo?.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 border ${statusInfo?.borderColor}`}
      >
        <StatusIcon className={`h-8 w-8 ${statusInfo?.color}`} />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {statusInfo?.title}
      </h3>

      <p className="text-gray-600 mb-2">
        <strong>{getFeatureDisplayName(feature)}</strong> is a premium feature.
      </p>

      <p className="text-gray-600 mb-6">{statusInfo?.message}</p>

      <div className="space-y-3">
        <button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <CreditCard className="h-5 w-5" />
          <span>
            {subscriptionStatus?.trialEnded
              ? "Subscribe Now"
              : "Start Free Trial"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => router.back()}
          className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
