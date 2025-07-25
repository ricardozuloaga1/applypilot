'use client'

import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export interface UserSubscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  plan: 'starter' | 'pro' | 'professional'
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete'
  credits_remaining: number | null  // null for unlimited
  credits_total: number | null
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

export interface SubscriptionFeatures {
  maxCredits: number | null  // null for unlimited
  creditsRemaining: number | null
  canGenerateDocuments: boolean
  canScoreJobs: boolean
  hasTeamFeatures: boolean
  planName: string
}

export class SubscriptionService {
  // Get user's current subscription status
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const response = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) return null

      const { subscription } = await response.json()
      return subscription
    } catch (error) {
      console.error('Failed to get subscription:', error)
      return null
    }
  }

  // Get subscription features and limitations
  static async getSubscriptionFeatures(userId: string): Promise<SubscriptionFeatures> {
    const subscription = await this.getUserSubscription(userId)

    if (!subscription) {
      // Free tier features
      return {
        maxCredits: 3,
        creditsRemaining: 3, // This should be tracked separately for free users
        canGenerateDocuments: true,
        canScoreJobs: true,
        hasTeamFeatures: false,
        planName: 'Basic (Free)'
      }
    }

    const planFeatures = {
      starter: {
        maxCredits: 75,
        hasTeamFeatures: false,
        planName: 'Starter Plan'
      },
      pro: {
        maxCredits: 300,
        hasTeamFeatures: false,
        planName: 'Pro Plan'
      },
      professional: {
        maxCredits: null, // Unlimited
        hasTeamFeatures: true,
        planName: 'Professional Plan'
      }
    }

    const features = planFeatures[subscription.plan]
    
    return {
      maxCredits: features.maxCredits,
      creditsRemaining: subscription.credits_remaining,
      canGenerateDocuments: subscription.status === 'active',
      canScoreJobs: subscription.status === 'active',
      hasTeamFeatures: features.hasTeamFeatures,
      planName: features.planName
    }
  }

  // Check if user can perform an action (costs credits)
  static async canPerformAction(userId: string, action: 'score' | 'generate'): Promise<{
    canPerform: boolean
    reason?: string
    creditsRemaining?: number | null
  }> {
    const features = await this.getSubscriptionFeatures(userId)

    if (!features.canGenerateDocuments && action === 'generate') {
      return {
        canPerform: false,
        reason: 'Subscription required for document generation'
      }
    }

    if (!features.canScoreJobs && action === 'score') {
      return {
        canPerform: false,
        reason: 'Subscription required for job scoring'
      }
    }

    // Check credits for non-unlimited plans
    if (features.maxCredits !== null) {
      const creditsRequired = action === 'generate' ? 3 : 1 // Generate costs 3, score costs 1
      
      if (features.creditsRemaining === null || features.creditsRemaining < creditsRequired) {
              return {
        canPerform: false,
        reason: `Insufficient credits. Need ${creditsRequired}, have ${features.creditsRemaining ?? 0}`,
        creditsRemaining: features.creditsRemaining ?? 0
      }
      }
    }

    return {
      canPerform: true,
      creditsRemaining: features.creditsRemaining
    }
  }

  // Deduct credits after successful action
  static async deductCredits(userId: string, action: 'score' | 'generate'): Promise<boolean> {
    try {
      const creditsToDeduct = action === 'generate' ? 3 : 1

      const response = await fetch('/api/subscription/deduct-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credits: creditsToDeduct })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to deduct credits:', error)
      return false
    }
  }

  // Create Stripe checkout session
  static async createCheckoutSession(userId: string, plan: 'starter' | 'pro' | 'professional'): Promise<string | null> {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan })
      })

      if (!response.ok) return null

      const { url } = await response.json()
      return url
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      return null
    }
  }

  // Redirect to Stripe checkout
  static async redirectToCheckout(userId: string, plan: 'starter' | 'pro' | 'professional'): Promise<void> {
    const checkoutUrl = await this.createCheckoutSession(userId, plan)
    
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    } else {
      throw new Error('Failed to create checkout session')
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      return false
    }
  }
}

export default SubscriptionService 