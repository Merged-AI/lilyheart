"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  X,
  Clock,
  Shield,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface SubscriptionInfo {
  hasSubscription: boolean;
  family: {
    subscription_status: string;
    trial_ends_at?: string;
    subscription_canceled_at?: string;
    cancel_at_period_end?: boolean;
    last_payment_at?: string;
  };
  subscription?: {
    id: string;
    status: string;
    cancel_at_period_end: boolean;
    current_period_start: number;
    current_period_end: number;
    trial_end?: number;
    canceled_at?: number;
  };
  billing?: {
    amount: number;
    currency: string;
    interval: string;
  };
  customer?: {
    email: string;
    name: string;
  };
}

export default function SubscriptionManagement() {
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/stripe/subscription-status");

      if (!response.ok) {
        throw new Error("Failed to fetch subscription information");
      }

      const data = await response.json();
      setSubscriptionInfo(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to load subscription information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCanceling(true);

      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel subscription");
      }

      const result = await response.json();
      toast.success("Subscription canceled successfully");
      setShowCancelModal(false);

      // Refresh subscription info
      await fetchSubscriptionInfo();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel subscription");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setIsReactivating(true);

      const response = await fetch("/api/stripe/reactivate-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reactivate subscription");
      }

      const result = await response.json();
      toast.success("Subscription reactivated successfully!");
      setShowReactivateModal(false);

      // Refresh subscription info
      await fetchSubscriptionInfo();
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate subscription");
    } finally {
      setIsReactivating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusInfo = () => {
    if (!subscriptionInfo) return null;

    const { family, subscription } = subscriptionInfo;

    if (
      family.subscription_status === "trialing" ||
      subscription?.status === "trialing"
    ) {
      return {
        status: "Free Trial",
        description: "Your free trial is active",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: CheckCircle,
      };
    }

    if (
      family.subscription_status === "active" &&
      !family.subscription_canceled_at &&
      !subscription?.cancel_at_period_end
    ) {
      return {
        status: "Active",
        description: "Your subscription is active",
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: CheckCircle,
      };
    }

    if (family.subscription_canceled_at || subscription?.cancel_at_period_end) {
      return {
        status: "Canceling",
        description: "Subscription will end at period end",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        icon: Clock,
      };
    }

    if (family.subscription_status === "canceled") {
      return {
        status: "Canceled",
        description: "Your subscription has been canceled",
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: X,
      };
    }

    return {
      status: "Inactive",
      description: "No active subscription",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      icon: AlertTriangle,
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
          <span className="text-gray-600">
            Loading subscription information...
          </span>
        </div>
      </div>
    );
  }

  if (error || !subscriptionInfo) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to Load Subscription
          </h3>
          <p className="text-gray-600 mb-4">{error || "An error occurred"}</p>
          <button
            onClick={fetchSubscriptionInfo}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo?.icon || AlertTriangle;

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Subscription Status
          </h3>
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusInfo?.bgColor}`}
          >
            <StatusIcon className={`h-4 w-4 ${statusInfo?.color}`} />
            <span className={`text-sm font-medium ${statusInfo?.color}`}>
              {statusInfo?.status}
            </span>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{statusInfo?.description}</p>

        {/* Billing Information */}
        {subscriptionInfo.hasSubscription && subscriptionInfo.billing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Billing Amount</p>
                <p className="font-medium">
                  {formatCurrency(
                    subscriptionInfo.billing.amount,
                    subscriptionInfo.billing.currency
                  )}
                  /{subscriptionInfo.billing.interval}
                </p>
              </div>
            </div>

            {subscriptionInfo.subscription && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">
                    {subscriptionInfo.subscription.cancel_at_period_end
                      ? "Ends On"
                      : "Next Billing"}
                  </p>
                  <p className="font-medium">
                    {formatDate(
                      subscriptionInfo.subscription.current_period_end
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trial Information */}
        {subscriptionInfo.family.trial_ends_at &&
          new Date(subscriptionInfo.family.trial_ends_at) > new Date() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-blue-800 font-medium">Free Trial Active</p>
                  <p className="text-blue-700 text-sm">
                    Your trial ends on{" "}
                    {new Date(
                      subscriptionInfo.family.trial_ends_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Cancellation Notice */}
        {(subscriptionInfo.family.subscription_canceled_at ||
          subscriptionInfo.subscription?.cancel_at_period_end) && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <Clock
                className="h-5 w-5 text-orange-600"
                style={{ minWidth: "20px" }}
              />
              <div>
                <p className="text-orange-800 font-medium">
                  Subscription Ending
                </p>
                <p className="text-orange-700 text-sm">
                  Your subscription will end on{" "}
                  {subscriptionInfo.subscription &&
                    formatDate(
                      subscriptionInfo.subscription.current_period_end
                    )}
                  . You'll retain access until then.
                </p>
                <p className="text-orange-700 text-sm mt-1">
                  Changed your mind? You can reactivate your subscription at any
                  time before it ends.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {subscriptionInfo.hasSubscription &&
            !subscriptionInfo.family.subscription_canceled_at &&
            !subscriptionInfo.subscription?.cancel_at_period_end && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel Subscription</span>
              </button>
            )}

          {/* Reactivate button for canceled subscriptions that haven't ended yet */}
          {subscriptionInfo.hasSubscription &&
            (subscriptionInfo.family.subscription_canceled_at ||
              subscriptionInfo.subscription?.cancel_at_period_end) && (
              <button
                onClick={() => setShowReactivateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Reactivate Subscription</span>
              </button>
            )}

          {!subscriptionInfo.hasSubscription && (
            <button
              onClick={() => (window.location.href = "/auth/register")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Subscribe Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
          >
            <div
              className="bg-white rounded-xl p-6 max-w-md w-full relative"
              style={{ zIndex: 100000 }}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cancel Subscription?
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to cancel your subscription? You'll
                  retain access until the end of your current billing period.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={isCanceling}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Keep Subscription
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isCanceling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Canceling...</span>
                      </>
                    ) : (
                      <span>Yes, Cancel</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
          >
            <div
              className="bg-white rounded-xl p-6 max-w-md w-full relative"
              style={{ zIndex: 100000 }}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Reactivate Subscription?
                </h3>
                <p className="text-gray-600 mb-6">
                  This will reactivate your subscription and continue billing
                  according to your current plan. Your subscription will no
                  longer be scheduled for cancellation.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowReactivateModal(false)}
                    disabled={isReactivating}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={isReactivating}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isReactivating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Reactivating...</span>
                      </>
                    ) : (
                      <span>Yes, Reactivate</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
