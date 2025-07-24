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

    // Check if subscription is in canceling status
    if (family.subscription_status !== "canceling") {
      return NextResponse.json(
        { error: "Subscription is not marked for cancellation" },
        { status: 400 }
      );
    }

    // Reactivate the subscription in Stripe (remove cancel_at_period_end)
    const reactivatedSubscription = await stripe.subscriptions.update(
      family.stripe_subscription_id,
      {
        cancel_at_period_end: false,
        metadata: {
          reactivated_by: "user",
          reactivated_at: new Date().toISOString(),
        },
      }
    );

    // Update the family record in Supabase to reflect reactivation
    const { error: updateError } = await supabase
      .from("families")
      .update({
        subscription_canceled_at: null,
        subscription_status: "active", // Set back to active
      })
      .eq("id", family.id);

    if (updateError) {
      console.error("Error updating family record:", updateError);
      // Continue anyway since Stripe was updated
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
