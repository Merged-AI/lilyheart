"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  Brain,
  ArrowLeft,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ResubscribeForm from "@/components/payment/resubscribe-form";
import toast from "react-hot-toast";
import { apiGet } from "@/lib/api";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function ResubscribePage() {
  const router = useRouter();
  const { family } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify user is authenticated and needs resubscription
    const checkEligibility = async () => {
      if (!family) {
        router.push("/auth/login");
        return;
      }

      try {
        const data = await apiGet<any>("stripe/subscription-status");

        // If user has active subscription, redirect to dashboard
        if (data.hasActiveSubscription || data.isTrialing) {
          router.push("/dashboard");
          return;
        }
      } catch (err) {
        setError("Failed to check subscription status");
      } finally {
        setIsLoading(false);
      }
    };

    checkEligibility();
  }, [family, router]);

  const handlePaymentSuccess = (result: any) => {
    toast.success("Subscription reactivated successfully!");
    router.push("/dashboard");
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setError(error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-purple-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!family) {
    return null; // Will redirect to login
  }

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
                <h1 className="text-xl font-bold text-gray-900">Lily Heart AI</h1>
                <p className="text-sm text-gray-600">Reactivate Subscription</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Pricing</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome Back to Lily Heart AI!
          </h1>
          <p className="text-lg text-gray-600">
            Continue your family's therapeutic journey
          </p>
        </div>

        {/* Subscription Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Family Communication Coach
            </h2>
            <div className="flex items-baseline justify-center space-x-2 mb-4">
              <span className="text-4xl font-bold text-gray-900">$39</span>
              <span className="text-gray-600 text-lg">/month</span>
            </div>
            <p className="text-gray-600 mb-6">
              Full access to all Lily Heart AI features
            </p>

            {/* Features Reminder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-6">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Unlimited AI conversations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Parent dashboard & insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Voice & text chat modes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Progress tracking</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 text-sm font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          <Elements stripe={stripePromise}>
            <ResubscribeForm
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Your payment information is secure and encrypted. Cancel anytime
            from your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
