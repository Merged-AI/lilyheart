"use client";

import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Lock, AlertCircle, CheckCircle } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentFormProps {
  familyData: {
    parentName: string;
    email: string;
    password: string;
    familyName: string;
    children: Array<{
      name: string;
      age: string;
      concerns: string;
    }>;
  };
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

export default function PaymentForm({
  familyData,
  onSuccess,
  onError,
}: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent
        familyData={familyData}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

function PaymentFormContent({
  familyData,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const hasCreatedSubscription = useRef(false);

  useEffect(() => {
    if (!hasCreatedSubscription.current) {
      hasCreatedSubscription.current = true;
      createSubscription();
    }
  }, []);

  const createSubscription = async () => {
    // Prevent multiple calls
    if (isLoading || subscriptionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const subscriptionResponse = await fetch(
        "/api/stripe/create-subscription-first",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(familyData),
        }
      );

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        console.error("Stripe subscription creation failed:", errorData);
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const data = await subscriptionResponse.json();

      // Clear any previous errors since subscription creation succeeded
      setError(null);

      setClientSecret(data.clientSecret);
      setSubscriptionId(data.subscriptionId);

      // Store email for later user polling
      setUserEmail(data.email);

      // If no client secret, the trial started successfully without payment
      if (!data.clientSecret) {
        // Wait for webhook to create user, then login
        await waitForUserCreation(data.email);
      }
    } catch (err: any) {
      console.error("Subscription creation error:", err);
      setError(err.message);
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const waitForUserCreation = async (email: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch("/api/auth/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: familyData.password,
            familyData: {
              parentName: familyData.parentName,
              familyName: familyData.familyName,
              children: familyData.children,
            },
          }),
        });

        if (response.ok) {
          const userData = await response.json();

          // Auto-login the user
          const loginResponse = await fetch("/api/auth/auto-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email,
              password: familyData.password,
            }),
          });

          if (loginResponse.ok) {
            onSuccess({
              subscriptionId: subscriptionId,
              email: email,
              status: "trialing",
              userId: userData.userId,
              familyId: userData.familyId,
            });
          } else {
            console.error("Auto-login failed, but user was created");
            onSuccess({
              subscriptionId: subscriptionId,
              email: email,
              status: "trialing",
              userId: userData.userId,
              familyId: userData.familyId,
              requiresManualLogin: true,
            });
          }
          return;
        }
      } catch (error) {
        console.log("User not ready yet, retrying in 1 second...");
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    }

    // Timeout - show error
    setError(
      "Account creation is taking longer than expected. Please try refreshing the page."
    );
    onError("Account creation timeout");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError("Payment system not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Payment form not ready. Please refresh and try again.");
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm the payment method
      const { error: confirmError, setupIntent } =
        await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: familyData.parentName,
              email: familyData.email,
            },
          },
        });

      if (confirmError) {
        setError(confirmError.message || "Payment setup failed");
        onError(confirmError.message || "Payment setup failed");
      } else if (setupIntent && setupIntent.status === "succeeded") {
        // Payment method saved successfully - now wait for user creation
        if (userEmail) {
          await waitForUserCreation(userEmail);
        } else {
          // Fallback if no email stored
          onSuccess({
            subscriptionId,
            setupIntentId: setupIntent.id,
            status: "trialing",
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Payment processing failed");
      onError(err.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#374151",
        "::placeholder": {
          color: "#9CA3AF",
        },
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      invalid: {
        color: "#DC2626",
        iconColor: "#DC2626",
      },
    },
    hidePostalCode: true,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">
          Creating your subscription and account...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Secure Payment Setup
          </h3>
          <p className="text-sm text-gray-600">
            Add your payment method to start your 7-day free trial
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 text-sm font-medium">Payment Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-1">
                  7-Day Free Trial
                </p>
                <p className="text-blue-700">
                  You won't be charged today. Your trial starts immediately and
                  you can cancel anytime during the 7 days.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Secure & Encrypted</span>
            </div>
            <p>
              Your payment information is encrypted and secure. You can cancel
              your subscription at any time.
            </p>
          </div>

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              "Complete Registration & Start Trial"
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            After your trial ends, you'll be charged $39/month. Cancel anytime.
          </p>
        </form>
      </div>
    </div>
  );
}
