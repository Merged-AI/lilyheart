import { NextRequest, NextResponse } from "next/server";
import {
  stripe,
  ensureProductAndPrice,
  createOrRetrieveCustomer,
} from "@/lib/stripe";
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

    // Check if user already has an active subscription
    if (family.stripe_subscription_id) {
      try {
        const existingSubscription = await stripe.subscriptions.retrieve(
          family.stripe_subscription_id
        );

        if (
          existingSubscription.status === "active" ||
          existingSubscription.status === "trialing"
        ) {
          return NextResponse.json(
            { error: "You already have an active subscription" },
            { status: 400 }
          );
        }
      } catch (error) {
        // Subscription doesn't exist in Stripe, continue with resubscription
        console.log(
          "Previous subscription not found in Stripe, continuing with resubscription"
        );
      }
    }

    console.log(
      "Creating resubscription for existing user:",
      family.parent_email
    );

    // Ensure Stripe product and price exist
    const { price } = await ensureProductAndPrice();

    // Get or create Stripe customer
    const customer = await createOrRetrieveCustomer(
      family.parent_email,
      family.parent_name
    );

    // Clear any previous metadata to avoid confusion with new user creation
    await stripe.customers.update(customer.id, {
      metadata: {
        platform: "heart-harbor",
        resubscription: "true",
        family_id: family.id.toString(),
      },
    });

    // Create new subscription with trial (since it's a returning customer, we can be generous)
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      trial_period_days: 7, // Give returning customers a 7-day trial
      expand: ["latest_invoice", "pending_setup_intent"],
    });

    console.log(
      "Stripe subscription created for resubscription:",
      subscription.id
    );

    // Update the family record with new subscription details
    const { error: updateError } = await supabase
      .from("families")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        subscription_status:
          subscription.status === "trialing"
            ? "trial"
            : subscription.status === "active"
            ? "active"
            : "inactive",
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        subscription_canceled_at: null, // Clear previous cancellation
        // Note: Removed cancel_at_period_end as it doesn't exist in families table
        subscription_current_period_start: (subscription as any)
          .current_period_start
          ? new Date(
              (subscription as any).current_period_start * 1000
            ).toISOString()
          : null,
        subscription_current_period_end: (subscription as any)
          .current_period_end
          ? new Date(
              (subscription as any).current_period_end * 1000
            ).toISOString()
          : null,
        last_payment_at: null, // Will be set when payment succeeds
        last_payment_failed_at: null, // Clear any previous payment failures
      })
      .eq("id", family.id);

    if (updateError) {
      console.error(
        "Error updating family with new subscription:",
        updateError
      );

      // Try to cancel the Stripe subscription if we couldn't update the database
      try {
        await stripe.subscriptions.cancel(subscription.id);
      } catch (cancelError) {
        console.error(
          "Error canceling Stripe subscription after database update failure:",
          cancelError
        );
      }

      return NextResponse.json(
        { error: "Failed to update subscription in database" },
        { status: 500 }
      );
    }

    // Get client secret for payment setup
    let clientSecret = null;

    // Handle latest_invoice expansion
    if (
      subscription.latest_invoice &&
      typeof subscription.latest_invoice === "object"
    ) {
      const invoice = subscription.latest_invoice as any;
      if (
        invoice.payment_intent &&
        typeof invoice.payment_intent === "object"
      ) {
        clientSecret = invoice.payment_intent.client_secret;
      }
    }

    // Handle pending_setup_intent expansion
    if (
      !clientSecret &&
      subscription.pending_setup_intent &&
      typeof subscription.pending_setup_intent === "object"
    ) {
      const setupIntent = subscription.pending_setup_intent as any;
      clientSecret = setupIntent.client_secret;
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret,
      trialEnd: subscription.trial_end,
      status: subscription.status,
      message: "Subscription reactivated successfully!",
    });
  } catch (error) {
    console.error("Resubscription error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
