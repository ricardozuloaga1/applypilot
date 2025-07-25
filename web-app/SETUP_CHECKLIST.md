# Apply Pilot AI - Setup Checklist

## 🔐 Authentication & Payment Setup

### ✅ Completed
- [x] Environment variables configured in `.env.local`
- [x] Database schema created (`database-schema.sql`)
- [x] Authentication system built with Supabase Auth
- [x] Stripe payment integration implemented
- [x] API routes created for subscriptions
- [x] Credit management system built
- [x] Landing page authentication integration

### 🔄 Still Need To Do

#### 1. Supabase Database Setup
1. **Go to Supabase Dashboard**: https://app.supabase.com/project/jnelcvbgrvwpsnjyqgck
2. **Run the Database Schema**:
   - Go to SQL Editor
   - Copy contents of `database-schema.sql`
   - Execute the SQL to create all tables and policies
3. **Get Service Role Key**:
   - Go to Settings → API
   - Copy the `service_role` key (not anon key)
   - Update `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`

#### 2. Stripe Setup
1. **Create Stripe Account**: https://dashboard.stripe.com/
2. **Get API Keys**:
   - Go to Developers → API Keys
   - Copy Publishable key and Secret key
   - Update `.env.local`:
     ```
     STRIPE_SECRET_KEY=sk_test_your_secret_key
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
     ```
3. **Set up Webhook**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy webhook secret and update `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret`

#### 3. Environment Variables Needed
Update these in `.env.local`:
```bash
# Get from Supabase Dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Get from Stripe Dashboard → Developers → API Keys  
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Get from Stripe Dashboard → Developers → Webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional - for server-side OpenAI calls
OPENAI_API_KEY=your_openai_api_key_here
```

### 🧪 Testing Checklist

#### Authentication Testing
- [ ] Sign up new user
- [ ] Sign in existing user  
- [ ] Password reset functionality
- [ ] User profile creation on signup
- [ ] Free credits (3) assigned to new users

#### Payment Testing (Use Stripe Test Mode)
- [ ] Create checkout session
- [ ] Complete test payment with card `4242 4242 4242 4242`
- [ ] Verify subscription created in database
- [ ] Test credit deduction
- [ ] Test subscription cancellation
- [ ] Verify webhook processing

#### Integration Testing
- [ ] Resume builder credit gating
- [ ] Job scoring credit deduction
- [ ] Document generation credit deduction
- [ ] Subscription status in dashboard
- [ ] Upgrade/downgrade flows

### 📋 Required Database Tables
The schema creates these key tables:
- `user_profiles` - Extended user information
- `user_subscriptions` - Paid subscription management
- `user_credits` - Free tier credit tracking
- `jobs` - Captured job postings
- `resumes` - User resume storage
- `generated_documents` - AI-generated documents
- `credit_usage_log` - Usage tracking
- `job_scores` - Scoring history

### 🔗 API Endpoints Created
- `POST /api/stripe/create-checkout-session` - Start subscription purchase
- `POST /api/stripe/webhook` - Handle payment events
- `POST /api/subscription/status` - Get user subscription info
- `POST /api/subscription/deduct-credits` - Deduct credits after actions
- `POST /api/subscription/cancel` - Cancel subscription

### 🚀 Deployment Notes
- Environment variables must be set in production
- Stripe webhook endpoint must be accessible publicly
- Database connection pool configured for production load
- RLS policies secure user data access

### 🐛 Common Issues & Solutions

**"Demo mode - auth not available"**
- Check if `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Verify Supabase project is active

**Stripe errors**
- Ensure you're using test keys for development
- Check webhook endpoint is publicly accessible
- Verify webhook secret matches Stripe dashboard

**Database connection errors**
- Check if database schema was executed successfully
- Verify service role key has correct permissions
- Ensure RLS policies allow user access

### 📞 Support
- Supabase Documentation: https://supabase.com/docs
- Stripe Documentation: https://stripe.com/docs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers 