"use client";

import { useState, useEffect } from 'react';

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
}

interface UseSubscriptionReturn {
  subscriptionInfo: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  isTrialing: boolean;
  isPaidSubscription: boolean;
  trialEnded: boolean;
  isCanceling: boolean;
  isCanceled: boolean;
  isMarkedForCancellation: boolean;
  canAccessFeature: (feature: string) => boolean;
  refetchSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  // Calculate subscription status
  const now = new Date();
  const trialEndsAt = subscriptionInfo?.family.trial_ends_at ? 
    new Date(subscriptionInfo.family.trial_ends_at) : null;
  
  const isTrialing = subscriptionInfo?.family.subscription_status === 'trialing' || 
    (trialEndsAt && trialEndsAt > now);
  
  const trialEnded = trialEndsAt && trialEndsAt <= now;
  const isPaidSubscription = subscriptionInfo?.family.subscription_status === 'active' && !isTrialing;
  
  // Check if subscription is canceled or canceling but still within period
  const isCanceled = subscriptionInfo?.family.subscription_status === 'canceled';
  const isCanceling = subscriptionInfo?.family.subscription_status === 'canceling';
  const isMarkedForCancellation = Boolean(
    subscriptionInfo?.family.subscription_canceled_at || 
    subscriptionInfo?.subscription?.cancel_at_period_end
  );
  const currentPeriodEnd = subscriptionInfo?.subscription?.current_period_end ? 
    new Date(subscriptionInfo.subscription.current_period_end * 1000) : null;
  const stillInCanceledPeriod = (isCanceled || isCanceling || isMarkedForCancellation) && currentPeriodEnd && currentPeriodEnd > now;
  
  const hasActiveSubscription = Boolean(
    subscriptionInfo?.hasSubscription && 
    (isPaidSubscription || isTrialing || stillInCanceledPeriod)
  );

  const canAccessFeature = (feature: string) => {
    // Free features available to everyone
    const freeFeatures = ['basic_profile', 'basic_dashboard'];
    
    if (freeFeatures.includes(feature)) {
      return true;
    }
    
    // Premium features require active subscription
    return hasActiveSubscription;
  };

  return {
    subscriptionInfo,
    isLoading,
    error,
    hasActiveSubscription,
    isTrialing: Boolean(isTrialing),
    isPaidSubscription: Boolean(isPaidSubscription),
    trialEnded: Boolean(trialEnded && !isPaidSubscription),
    isCanceling: Boolean(isCanceling),
    isCanceled: Boolean(isCanceled),
    isMarkedForCancellation: Boolean(isMarkedForCancellation),
    canAccessFeature,
    refetchSubscription: fetchSubscriptionInfo
  };
} 