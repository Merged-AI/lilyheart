import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  createServerSupabase,
  getAuthenticatedFamilyFromToken,
} from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
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

    if (!family.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    // Check if subscription is actually marked for cancellation
    if (!family.subscription_canceled_at) {
      return NextResponse.json(
        { error: "Subscription is not marked for cancellation" },
        { status: 400 }
      );
    }

    // Check if subscription status is still active (not fully canceled yet)
    if (family.subscription_status === "canceled") {
      return NextResponse.json(
        {
          error:
            "Subscription has already been canceled and cannot be reactivated",
        },
        { status: 400 }
      );
    }

    // Reactivate the subscription in Stripe by removing cancel_at_period_end
    const reactivatedSubscription = await stripe.subscriptions.update(
      family.stripe_subscription_id,
      {
        cancel_at_period_end: false,
        metadata: {
          reactivated_by: "user",
          reactivated_at: new Date().toISOString(),
          previous_cancellation: family.subscription_canceled_at,
        },
      }
    );

    // Update the family record in Supabase to remove cancellation
    const { error: updateError } = await supabase
      .from("families")
      .update({
        subscription_canceled_at: null, // Remove the cancellation timestamp
        // Keep subscription_status as 'active' since it should still be active
      })
      .eq("id", family.id);

    if (updateError) {
      console.error("Error updating family record:", updateError);
      // Continue anyway since Stripe was updated successfully
    }

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated successfully",
      subscription: {
        id: reactivatedSubscription.id,
        status: reactivatedSubscription.status,
        cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
        current_period_end: (reactivatedSubscription as any).current_period_end,
      },
    });
  } catch (error) {
    console.error("Subscription reactivation error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
