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

    // Check if subscription is in canceling or canceled status
    if (
      family.subscription_status !== "canceling" &&
      family.subscription_status !== "canceled"
    ) {
      return NextResponse.json(
        { error: "Subscription is not marked for cancellation" },
        { status: 400 }
      );
    }

    let reactivatedSubscription;

    if (family.subscription_status === "canceled") {
      // For canceled subscriptions, we need to create a new subscription
      // since Stripe doesn't allow updating canceled subscriptions

      // Get the existing customer
      const existingSubscription = await stripe.subscriptions.retrieve(
        family.stripe_subscription_id
      );
      const customerId = existingSubscription.customer as string;

      // Get the price from the canceled subscription
      const priceId = existingSubscription.items.data[0].price.id;

      // Check if customer has a default payment method
      const customer = await stripe.customers.retrieve(customerId);

      // Check multiple sources for payment methods
      const invoiceDefaultPaymentMethod =
        customer &&
        !customer.deleted &&
        (customer as any).invoice_settings?.default_payment_method;
      const legacyDefaultSource =
        customer && !customer.deleted && (customer as any).default_source;

      // List payment methods attached to customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      const hasDefaultPaymentMethod = !!(
        invoiceDefaultPaymentMethod || legacyDefaultSource
      );
      const hasAnyPaymentMethods = paymentMethods.data.length > 0;

      // Update customer metadata for reactivation tracking
      await stripe.customers.update(customerId, {
        metadata: {
          platform: "heart-harbor",
          reactivation: "true",
          family_id: family.id.toString(),
          previous_subscription_id: family.stripe_subscription_id,
        },
      });

      // Try to create active subscription first if we have payment methods
      if (hasDefaultPaymentMethod || hasAnyPaymentMethods) {
        try {
          // Set the default payment method on subscription and use allow_incomplete
          const subscriptionParams: any = {
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: "allow_incomplete", // Allow incomplete, but try payment
            expand: ["latest_invoice.payment_intent"],
            metadata: {
              reactivated_by: "user",
              reactivated_at: new Date().toISOString(),
              previous_subscription_id: family.stripe_subscription_id,
            },
          };

          // If we have a default payment method, set it explicitly
          if (invoiceDefaultPaymentMethod) {
            subscriptionParams.default_payment_method =
              invoiceDefaultPaymentMethod;
          } else if (hasAnyPaymentMethods && paymentMethods.data.length > 0) {
            // Use the first available payment method
            subscriptionParams.default_payment_method =
              paymentMethods.data[0].id;
          }

          reactivatedSubscription = await stripe.subscriptions.create(
            subscriptionParams
          );
        } catch (error: any) {
          // Fall back to incomplete payment flow
          reactivatedSubscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: "default_incomplete",
            payment_settings: {
              save_default_payment_method: "on_subscription",
            },
            expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
            metadata: {
              reactivated_by: "user",
              reactivated_at: new Date().toISOString(),
              previous_subscription_id: family.stripe_subscription_id,
              fallback_reason: error.message,
            },
          });
        }
      } else {
        // No default payment method, use incomplete flow
        reactivatedSubscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
          metadata: {
            reactivated_by: "user",
            reactivated_at: new Date().toISOString(),
            previous_subscription_id: family.stripe_subscription_id,
          },
        });
      }

      // Update family record with new subscription ID
      await supabase
        .from("families")
        .update({
          stripe_subscription_id: reactivatedSubscription.id,
        })
        .eq("id", family.id);
    } else {
      reactivatedSubscription = await stripe.subscriptions.update(
        family.stripe_subscription_id,
        {
          cancel_at_period_end: false,
          metadata: {
            reactivated_by: "user",
            reactivated_at: new Date().toISOString(),
          },
        }
      );
    }

    // Update the family record in Supabase to reflect reactivation
    let updateData: any;

    if (family.subscription_status === "canceled") {
      // For canceled subscriptions, update all subscription details since we created a new one
      updateData = {
        stripe_subscription_id: reactivatedSubscription.id,
        subscription_canceled_at: null,
        subscription_status: "active",
        // Note: Current period dates and payment history will be updated by webhook
      };
    } else {
      // For canceling subscriptions, only clear the cancellation - preserve all existing data
      updateData = {
        subscription_canceled_at: null,
        subscription_status: "active",
        // Preserve: subscription_current_period_start, subscription_current_period_end,
        // last_payment_at, trial_ends_at, etc. - all existing subscription data stays intact
      };
    }

    const { error: updateError } = await supabase
      .from("families")
      .update(updateData)
      .eq("id", family.id);

    if (updateError) {
      console.error("Error updating family record:", updateError);
      // Continue anyway since Stripe was updated
    }

    // Handle response based on the type of reactivation
    let clientSecret = null;
    let requiresPayment = false;
    let reactivationType =
      family.subscription_status === "canceled"
        ? "new_subscription"
        : "remove_cancellation";

    if (family.subscription_status === "canceled") {
      // For canceled subscriptions that required new subscription creation
      // Handle latest_invoice expansion
      if (
        reactivatedSubscription.latest_invoice &&
        typeof reactivatedSubscription.latest_invoice === "object"
      ) {
        const invoice = reactivatedSubscription.latest_invoice as any;
        if (
          invoice.payment_intent &&
          typeof invoice.payment_intent === "object"
        ) {
          clientSecret = invoice.payment_intent.client_secret;
          requiresPayment = invoice.payment_intent.status !== "succeeded";
        }
      }

      // Handle pending_setup_intent expansion
      if (
        !clientSecret &&
        reactivatedSubscription.pending_setup_intent &&
        typeof reactivatedSubscription.pending_setup_intent === "object"
      ) {
        const setupIntent = reactivatedSubscription.pending_setup_intent as any;
        clientSecret = setupIntent.client_secret;
        requiresPayment = true;
      }

      // If no client secret is needed, payment was successful
      if (!clientSecret && reactivatedSubscription.status === "active") {
        requiresPayment = false;
      } else if (!clientSecret) {
        requiresPayment = true;
      }
    } else {
      // For canceling subscriptions, no payment is needed - just continue existing billing cycle
      requiresPayment = false;
      clientSecret = null;
    }

    const getMessage = () => {
      if (reactivationType === "remove_cancellation") {
        return "Subscription reactivated successfully - billing will continue on your current cycle";
      } else if (requiresPayment) {
        return "Subscription reactivated - payment confirmation required";
      } else {
        return "Subscription reactivated successfully with saved payment method";
      }
    };

    return NextResponse.json({
      success: true,
      message: getMessage(),
      subscription: {
        id: reactivatedSubscription.id,
        status: reactivatedSubscription.status,
        cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
        current_period_end: (reactivatedSubscription as any).current_period_end,
      },
      clientSecret, // Only for canceled subscriptions that need payment setup
      requiresPayment,
      reactivationType, // "remove_cancellation" or "new_subscription"
      paymentMethod: requiresPayment
        ? "setup_required"
        : reactivationType === "remove_cancellation"
        ? "existing_cycle"
        : "default_used",

      // Frontend Usage Guide:
      // - reactivationType === "remove_cancellation": Show success, no payment needed, billing continues on current cycle
      // - reactivationType === "new_subscription" && !requiresPayment: Show success, subscription active immediately
      // - reactivationType === "new_subscription" && requiresPayment: Show payment form using clientSecret
    });
  } catch (error) {
    console.error("Subscription reactivation error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
