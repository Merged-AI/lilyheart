import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  createServerSupabase,
  getAuthenticatedFamilyFromToken,
} from "@/lib/supabase-auth";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated family from token
    const family = await getAuthenticatedFamilyFromToken();

    if (!family) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = createServerSupabase();

    // Family record already obtained from token authentication

    // Check if we have Stripe subscription ID stored
    if (!family.stripe_subscription_id) {
      return NextResponse.json({
        hasSubscription: false,
        family: {
          subscription_status: family.subscription_status || "inactive",
          trial_ends_at: family.trial_ends_at,
          parent_email: family.parent_email,
        },
      });
    }

    // Get detailed subscription info from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      family.stripe_subscription_id,
      {
        expand: ["default_payment_method", "latest_invoice"],
      }
    );

    // Get customer info for payment method details
    const customer = await stripe.customers.retrieve(
      subscription.customer as string
    );

    return NextResponse.json({
      hasSubscription: true,
      family: {
        subscription_status: family.subscription_status,
        trial_ends_at: family.trial_ends_at,
        subscription_canceled_at: family.subscription_canceled_at,
        last_payment_at: family.last_payment_at,
        parent_email: family.parent_email,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: (subscription as any).items?.data?.[0]
          ?.current_period_start,
        current_period_end: (subscription as any).items?.data?.[0]
          ?.current_period_end,
        trial_end: subscription.trial_end,
        canceled_at: subscription.canceled_at,
      },
      billing: {
        amount: subscription.items.data[0]?.price?.unit_amount || 3900,
        currency: subscription.items.data[0]?.price?.currency || "usd",
        interval:
          subscription.items.data[0]?.price?.recurring?.interval || "month",
      },
      customer: {
        email: (customer as any).email,
        name: (customer as any).name,
      },
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve subscription status" },
      { status: 500 }
    );
  }
}
