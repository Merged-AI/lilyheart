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
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Check if subscription is already canceled
    if (family.subscription_status === "canceled") {
      return NextResponse.json(
        { error: "Subscription is already canceled" },
        { status: 400 }
      );
    }

    // Cancel the subscription in Stripe (at period end)
    const canceledSubscription = await stripe.subscriptions.update(
      family.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        metadata: {
          canceled_by: "user",
          canceled_at: new Date().toISOString(),
        },
      }
    );

    // Update the family record in Supabase to reflect cancellation
    // Keep subscription_status as active but mark it as canceled at period end
    const { error: updateError } = await supabase
      .from("families")
      .update({
        subscription_canceled_at: new Date().toISOString(),
        // Don't change subscription_status yet - keep it 'active' until period ends
        // The webhook will handle the final status change to 'canceled'
      })
      .eq("id", family.id);

    if (updateError) {
      console.error("Error updating family record:", updateError);
      // Continue anyway since Stripe was updated
    }

    return NextResponse.json({
      success: true,
      message: "Subscription canceled successfully",
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: (canceledSubscription as any).current_period_end,
      },
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
