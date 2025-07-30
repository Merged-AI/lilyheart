# Lily Heart AI Stripe Integration Setup Guide

## 🎉 What's Been Completed

✅ **Stripe Dependencies Installed**
- `stripe` (server-side)
- `@stripe/stripe-js` (client-side) 
- `@stripe/react-stripe-js` (payment forms)

✅ **Database Migration Applied**
- Added Stripe columns to families table
- Updated subscription status constraints
- Added necessary indexes

✅ **Code Integration Complete**
- Payment form component with trial setup
- Subscription creation API endpoint
- Webhook handler for Stripe events
- 3-step registration flow (Account → Family → Payment)
- Updated homepage with proper signup flow

## 🔧 What You Need to Complete

### 1. Environment Variables
Add these to your `.env.local` file:

```bash
# Stripe Configuration (Test Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RZsziPFUYictMBjeXyv5mZ4H4srEhRJFLmE7RlWCQu0yNZ40nehnAwdpXkZ0UICkGW4iQrvBzTrPHu3mw4Bnrqp00sY6DhFAc
STRIPE_SECRET_KEY=sk_test_51RZsziPFUYictMBjcIAQ1uKWulZOZpr9PjQwSwc7LXE4YJ8Pr54Jdyb3Gh63IeNxiUncCVlYL0O6rEQNYVLwx3DD00J01hnVmo
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Install Stripe CLI for Local Testing

**Install Stripe CLI** (choose one method):
- **GitHub:** Download from https://github.com/stripe/stripe-cli/releases/latest
- **Scoop (Windows):** `scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git && scoop install stripe`
- **Homebrew (macOS):** `brew install stripe/stripe-cli/stripe`

**Authenticate:**
```bash
stripe login
```

### 3. Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Start webhook forwarding (in new terminal):**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the webhook signing secret and update `STRIPE_WEBHOOK_SECRET` in `.env.local`

3. **Test Stripe connection:**
   Visit: `http://localhost:3000/api/stripe/test`
   
   You should see a success response with your Stripe account details and the Lily Heart AI product/price information.

4. **Test the registration flow:**
   - Go to `http://localhost:3000/auth/register`
   - Complete all 3 steps to ensure payment form works
   - Watch webhook events in the CLI terminal

### 4. Set Up Stripe Webhooks

**For Local Development:**
Use the Stripe CLI forwarding (step 2 above) - no additional setup needed!

**For Production Deployment:**

**In your Stripe Dashboard:**

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and update `STRIPE_WEBHOOK_SECRET` in `.env.local`

### 5. Configure Stripe Products (Auto-Created)

The system will automatically create:
- **Product:** "Family Communication Coach"
- **Price:** $39.00/month with 7-day trial
- **Features:** All Lily Heart AI features included

## 🎯 How the Flow Works

### Registration Process:
1. **Step 1:** Parent creates account (name, email, password)
2. **Step 2:** Family setup (family name, children details)
3. **Step 3:** Payment method (7-day free trial, no immediate charge)

### Subscription Lifecycle:
- **Trial Period:** 7 days free, no charge
- **After Trial:** $39/month automatic billing
- **Payment Method:** Required upfront but not charged during trial

### Database Integration:
- Family records created with Stripe customer/subscription IDs
- Webhooks keep subscription status synchronized
- Parent dashboard shows trial/subscription status

## 🧪 Testing Scenarios

### Test Cards (Use in Development):
- **Success:** `4242424242424242`
- **Declined:** `4000000000000002`
- **Requires Authentication:** `4000002500003155`

### Test Registration:
1. Use test email: `test@heartharber.com`
2. Add 1-2 test children
3. Use test card number: `4242424242424242`
4. Any future date for expiry, any CVC

## 🚀 Production Checklist

Before going live:

- [ ] Replace test keys with live Stripe keys
- [ ] Set up live webhook endpoint
- [ ] Test with real payment methods
- [ ] Configure proper error logging
- [ ] Set up subscription management (cancel/update)
- [ ] Test webhook delivery

## 🔍 Monitoring & Analytics

Key metrics to track:
- Trial conversion rate
- Monthly recurring revenue (MRR)
- Churn rate
- Payment failures

## 📞 Support

If you encounter issues:
1. Check the test endpoint: `/api/stripe/test`
2. Review browser console for client-side errors
3. Check server logs for API errors
4. Verify webhook delivery in Stripe dashboard

## 🎉 You're Ready!

Once you've completed the environment setup and webhook configuration, your Lily Heart AI platform will have full Stripe integration with:

- ✅ 7-day free trial signup
- ✅ Automated billing after trial
- ✅ Real-time subscription management
- ✅ Parent dashboard integration
- ✅ Secure payment processing

The system is designed to handle all the complex subscription management automatically while providing a smooth experience for families joining Lily Heart AI. 