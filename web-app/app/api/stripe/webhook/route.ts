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

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id)
  
  const userId = session.metadata?.user_id
  const plan = session.metadata?.plan
  const credits = parseInt(session.metadata?.credits || '0')

  if (!userId || !plan) {
    console.error('Missing user_id or plan in session metadata')
    return
  }

  // Update user subscription in database
  await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      plan: plan,
      status: 'active',
      credits_remaining: credits === -1 ? null : credits, // null for unlimited
      credits_total: credits === -1 ? null : credits,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  console.log(`Subscription activated for user ${userId} with plan ${plan}`)
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('Processing invoice payment succeeded:', invoice.id)
  
  const subscriptionId = invoice.subscription
  if (!subscriptionId) return

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = (subscription as any).metadata?.user_id

  if (!userId) {
    console.error('No user_id found in subscription metadata')
    return
  }

  // Reset credits for the new billing period
  const { data: currentSub } = await supabase
    .from('user_subscriptions')
    .select('plan, credits_total')
    .eq('user_id', userId)
    .single()

  if (currentSub) {
    const creditsToReset = currentSub.credits_total === null ? null : currentSub.credits_total

    await supabase
      .from('user_subscriptions')
      .update({
        credits_remaining: creditsToReset,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    console.log(`Credits reset for user ${userId}: ${creditsToReset || 'unlimited'}`)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Processing subscription updated:', subscription.id)
  
  const userId = subscription.metadata?.user_id
  if (!userId) return

  await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing subscription deleted:', subscription.id)
  
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log('Processing invoice payment failed:', invoice.id)
  
  const subscriptionId = invoice.subscription
  
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)
} 