"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
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
import Modal from "@/components/common/Modal";
import ResubscribeForm from "@/components/payment/resubscribe-form";
import { apiGet, apiPost } from "@/lib/api";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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
  const router = useRouter();
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showInlineReactivate, setShowInlineReactivate] = useState(false);
  const [selectedCancellationReason, setSelectedCancellationReason] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await apiGet<SubscriptionInfo>("stripe/subscription-status");
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

      const result = await apiPost<{ message: string }>(
        "stripe/cancel-subscription",
        {
          cancellation_feedback: selectedCancellationReason
            ? {
                challenge: selectedCancellationReason,
                selected_at: new Date().toISOString(),
                intervention_shown: true,
                proceeded_to_cancel: true,
              }
            : null,
        }
      );
      toast.success(result.message || "Subscription canceled successfully");
      setShowCancelModal(false);
      setSelectedCancellationReason(null); // Reset the selected reason

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

      const result = await apiPost<{ message: string }>(
        "stripe/reactivate-subscription",
        {}
      );
      toast.success(result.message || "Subscription reactivated successfully!");
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
      month: "short",
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

    if (subscription?.cancel_at_period_end) {
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
      {/* Subscription & Billing Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-gray-500" />
          <span>Subscription & Billing</span>
        </h3>
        <p className="text-sm text-gray-600">
          Manage your subscription, billing, and payment information
        </p>
      </div>

      {/* Subscription Status */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-base font-medium text-gray-900">
            Current Status
          </h4>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Monthly Cost</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(
                      subscriptionInfo.billing.amount,
                      subscriptionInfo.billing.currency
                    )}
                  </p>
                </div>
              </div>
            </div>

            {subscriptionInfo.subscription && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {subscriptionInfo.family.subscription_status ===
                      "canceled"
                        ? "Canceled On"
                        : subscriptionInfo.subscription.cancel_at_period_end
                        ? "Ends On"
                        : "Next Billing"}
                    </p>
                    <p className="font-semibold">
                      {subscriptionInfo.family.subscription_status ===
                      "canceled"
                        ? formatDate(
                            subscriptionInfo.subscription.canceled_at ||
                              subscriptionInfo.subscription.current_period_end
                          )
                        : formatDate(
                            subscriptionInfo.subscription.current_period_end
                          )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="font-semibold">Family Coach</p>
                </div>
              </div>
            </div>
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
          <div
            className={`${
              subscriptionInfo.family.subscription_status === "canceled"
                ? "bg-red-50 border-red-200"
                : "bg-orange-50 border-orange-200"
            } border rounded-lg p-4 mb-4`}
          >
            <div className="flex items-center space-x-2">
              {subscriptionInfo.family.subscription_status === "canceled" ? (
                <X className="h-5 w-5 text-red-600 min-w-[20px]" />
              ) : (
                <Clock className="h-5 w-5 text-orange-600 min-w-[20px]" />
              )}
              <div>
                <p
                  className={`${
                    subscriptionInfo.family.subscription_status === "canceled"
                      ? "text-red-800"
                      : "text-orange-800"
                  } font-medium`}
                >
                  {subscriptionInfo.family.subscription_status === "canceled"
                    ? "Subscription Canceled"
                    : "Subscription Ending"}
                </p>
                <p
                  className={`${
                    subscriptionInfo.family.subscription_status === "canceled"
                      ? "text-red-700"
                      : "text-orange-700"
                  } text-sm`}
                >
                  {subscriptionInfo.family.subscription_status === "canceled"
                    ? "Your subscription has been canceled and is no longer active."
                    : `Your subscription will end on ${
                        subscriptionInfo.subscription &&
                        formatDate(
                          subscriptionInfo.subscription.current_period_end
                        )
                      }. You'll retain access until then.`}
                </p>
                {subscriptionInfo.family.subscription_status !== "canceled" && (
                  <p className="text-orange-700 text-sm mt-1">
                    Changed your mind? You can reactivate your subscription at
                    any time before it ends.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {subscriptionInfo.hasSubscription &&
            !subscriptionInfo.family.subscription_canceled_at &&
            !subscriptionInfo.subscription?.cancel_at_period_end &&
            subscriptionInfo.family.subscription_status !== "canceled" && (
              <button
                onClick={() => setShowInterventionModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel Subscription</span>
              </button>
            )}

          {/* Undo Cancellation button for canceled subscriptions that haven't ended yet */}
          {subscriptionInfo.hasSubscription &&
            (subscriptionInfo.family.subscription_canceled_at ||
              subscriptionInfo.subscription?.cancel_at_period_end) &&
            subscriptionInfo.family.subscription_status !== "canceled" && (
              <button
                onClick={() => setShowReactivateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Undo Cancellation</span>
              </button>
            )}

          {/* Subscribe button for new users or those with canceled subscriptions */}
          {(!subscriptionInfo.hasSubscription ||
            subscriptionInfo.family.subscription_status === "canceled") && (
            <button
              onClick={() =>
                subscriptionInfo.family.subscription_status === "canceled"
                  ? setShowInlineReactivate(true)
                  : router.push("/pricing")
              }
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {subscriptionInfo.family.subscription_status === "canceled"
                  ? "Resubscribe with Payment"
                  : "Subscribe Now"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Reactivation Section */}
      {showInlineReactivate && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Reactivate Your Subscription
            </h4>
            <button
              onClick={() => setShowInlineReactivate(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <Elements stripe={stripePromise}>
            <ResubscribeForm
              userDetails={subscriptionInfo?.customer ? {
                name: subscriptionInfo.customer.name,
                email: subscriptionInfo.customer.email,
              } : undefined}
              onSuccess={(result) => {
                setShowInlineReactivate(false);
                toast.success("Subscription reactivated successfully!");
                fetchSubscriptionInfo(); // Refresh subscription info
              }}
              onError={(error) => {
                toast.error(error);
              }}
            />
          </Elements>
        </div>
      )}

      {/* Before-Cancel Intervention Modal */}
      <Modal
        isOpen={showInterventionModal}
        onClose={() => setShowInterventionModal(false)}
        title="What would make this more helpful?"
        type="info"
        maxWidth="max-w-2xl"
        icon={<AlertTriangle className="h-6 w-6" />}
      >
        <div className="space-y-4">
          <p className="text-gray-700 text-center mb-6">
            As a parent, what's been your biggest challenge with Lily Heart AI?
          </p>

          <div className="space-y-3">
            {/* Parent Issue 1: Child engagement */}
            <button
              onClick={() => {
                setSelectedCancellationReason("child_not_engaged");
                setShowInterventionModal(false);
                setShowCancelModal(true);
              }}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center min-w-8">
                  <span className="text-sm font-semibold text-red-600">🎯</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    My child isn't staying engaged or interested
                  </h4>
                </div>
              </div>
            </button>

            {/* Parent Issue 2: Understanding progress */}
            <button
              onClick={() => {
                setSelectedCancellationReason("unsure_if_helping");
                setShowInterventionModal(false);
                setShowCancelModal(true);
              }}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center min-w-8">
                  <span className="text-sm font-semibold text-red-600">📈</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    I'm not sure if it's actually helping
                  </h4>
                </div>
              </div>
            </button>

            {/* Parent Issue 3: App complexity/usability */}
            <button
              onClick={() => {
                setSelectedCancellationReason("app_confusing");
                setShowInterventionModal(false);
                setShowCancelModal(true);
              }}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center min-w-8">
                  <span className="text-sm font-semibold text-red-600">🤷</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    The app feels confusing or hard to use
                  </h4>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription?"
        type="warning"
        icon={<AlertTriangle className="h-6 w-6" />}
        primaryButton={{
          text: isCanceling ? "Canceling..." : "Yes, Cancel",
          onClick: handleCancelSubscription,
          disabled: isCanceling,
          className:
            "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2",
        }}
        secondaryButton={{
          text: "Keep Subscription",
          onClick: () => setShowCancelModal(false),
          disabled: isCanceling,
          className:
            "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed",
        }}
      >
        <div>
          <p className="text-gray-700 leading-relaxed">
            Are you sure you want to cancel your subscription? You'll retain
            access until the end of your current billing period.
          </p>
        </div>
      </Modal>

      {/* Undo Cancellation Confirmation Modal */}
      <Modal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        title="Undo Cancellation?"
        type="success"
        icon={<CheckCircle className="h-6 w-6" />}
        primaryButton={{
          text: isReactivating ? "Undoing..." : "Undo Cancellation",
          onClick: handleReactivateSubscription,
          disabled: isReactivating,
          className:
            "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2",
        }}
        secondaryButton={{
          text: "Keep Cancellation",
          onClick: () => setShowReactivateModal(false),
          disabled: isReactivating,
          className:
            "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed",
        }}
      >
        <div>
          <p className="text-gray-700 leading-relaxed">
            This will undo your cancellation and continue your subscription
            according to your current plan. Your subscription will no longer be
            scheduled to end.
          </p>
        </div>
      </Modal>
    </div>
  );
}
