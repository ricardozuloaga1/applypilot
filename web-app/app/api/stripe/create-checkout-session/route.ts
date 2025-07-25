import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Pricing tier configurations
const PRICING_PLANS = {
  starter: {
    price: 900, // $9.00 in cents
    credits: 75,
    name: 'Starter Plan',
    description: '75 credits/month - Perfect for active job seekers'
  },
  pro: {
    price: 1900, // $19.00 in cents  
    credits: 300,
    name: 'Pro Plan',
    description: '300 credits/month - For serious job hunters'
  },
  professional: {
    price: 5900, // $59.00 in cents
    credits: -1, // Unlimited
    name: 'Professional Plan',
    description: 'Unlimited credits + team features'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { plan, userId } = await request.json()

    if (!plan || !userId) {
      return NextResponse.json(
        { error: 'Plan and user ID are required' },
        { status: 400 }
      )
    }

    const planConfig = PRICING_PLANS[plan as keyof typeof PRICING_PLANS]
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Get user details from Supabase
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId: string
    
    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.user.email,
        metadata: {
          supabase_user_id: userId,
        },
      })
      customerId = customer.id

      // Update user profile with Stripe customer ID
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
      metadata: {
        user_id: userId,
        plan: plan,
        credits: planConfig.credits.toString(),
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })

  } catch (error: any) {
    console.error('Stripe checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 