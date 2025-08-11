"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { apiPost } from "@/lib/api";

interface ResubscribeFormProps {
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  userDetails?: {
    name: string;
    email: string;
  };
}

export default function ResubscribeForm({
  onSuccess,
  onError,
  userDetails,
}: ResubscribeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remove the useEffect that automatically creates resubscription
  // The subscription will only be created when the form is submitted

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
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
      // First, get the setup intent for payment method collection
      const resubscribeData = await apiPost("/stripe/resubscribe");

      if (!resubscribeData.clientSecret) {
        setError("Failed to initialize payment setup. Please try again.");
        onError("Failed to initialize payment setup");
        return;
      }

      // Confirm the payment method setup
      const { error: confirmError, setupIntent } =
        await stripe.confirmCardSetup(resubscribeData.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: userDetails
              ? {
                  name: userDetails.name,
                  email: userDetails.email,
                }
              : undefined,
          },
        });

      if (confirmError) {
        setError(confirmError.message || "Payment setup failed");
        onError(confirmError.message || "Payment setup failed");
      } else if (setupIntent && setupIntent.status === "succeeded") {
        // Payment method saved successfully, now create the subscription
        const subscriptionData = await apiPost(
          "/stripe/create-subscription-from-setup",
          {
            setupIntentId: setupIntent.id,
            customerId: resubscribeData.customerId,
          }
        );

        if (subscriptionData.success) {
          onSuccess({
            subscriptionId: subscriptionData.subscriptionId,
            customerId: resubscribeData.customerId,
            setupIntentId: setupIntent.id,
            status: subscriptionData.status,
            trialEnd: subscriptionData.trialEnd,
            message: "Subscription reactivated successfully!",
          });
        } else {
          setError(subscriptionData.error || "Failed to create subscription");
          onError(subscriptionData.error || "Failed to create subscription");
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

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Reactivate Your Subscription
          </h3>
          <p className="text-sm text-gray-600">
            Add your payment method to continue with Lily Heart AI
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
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
                  Welcome Back - 7-Day Trial
                </p>
                <p className="text-blue-700">
                  As a returning customer, enjoy another 7-day free trial. You
                  can cancel anytime during the trial period.
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
              your subscription at any time from your profile.
            </p>
          </div>

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Reactivating Subscription...
              </div>
            ) : (
              "Reactivate Subscription"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
