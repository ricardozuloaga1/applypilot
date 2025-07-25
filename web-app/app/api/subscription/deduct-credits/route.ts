import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, credits } = await request.json()

    if (!userId || !credits || credits <= 0) {
      return NextResponse.json(
        { error: 'Valid user ID and credit amount are required' },
        { status: 400 }
      )
    }

    // First, check if user has an active subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (subError && subError.code !== 'PGRST116') {
      console.error('Subscription fetch error:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    if (subscription) {
      // User has a subscription
      if (subscription.credits_remaining === null) {
        // Unlimited plan - no deduction needed
        await supabase
          .from('credit_usage_log')
          .insert({
            user_id: userId,
            action_type: credits === 1 ? 'score' : 'generate',
            credits_used: credits,
            credits_remaining: null,
            details: { plan: subscription.plan, unlimited: true }
          })

        return NextResponse.json({ success: true, unlimited: true })
      }

      // Limited subscription - deduct credits
      if (subscription.credits_remaining < credits) {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 } // Payment required
        )
      }

      const newCreditsRemaining = subscription.credits_remaining - credits

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          credits_remaining: newCreditsRemaining,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      if (updateError) {
        console.error('Credits update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update credits' },
          { status: 500 }
        )
      }

      // Log the usage
      await supabase
        .from('credit_usage_log')
        .insert({
          user_id: userId,
          action_type: credits === 1 ? 'score' : 'generate',
          credits_used: credits,
          credits_remaining: newCreditsRemaining,
          details: { plan: subscription.plan }
        })

      return NextResponse.json({ 
        success: true, 
        creditsRemaining: newCreditsRemaining 
      })
    }

    // Free tier user - deduct from user_credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (creditsError) {
      console.error('Free credits fetch error:', creditsError)
      return NextResponse.json(
        { error: 'Failed to fetch free credits' },
        { status: 500 }
      )
    }

    if (userCredits.credits_remaining < credits) {
      return NextResponse.json(
        { error: 'Insufficient free credits' },
        { status: 402 }
      )
    }

    const newFreeCredits = userCredits.credits_remaining - credits

    const { error: updateFreeError } = await supabase
      .from('user_credits')
      .update({ 
        credits_remaining: newFreeCredits,
        credits_used: userCredits.credits_used + credits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateFreeError) {
      console.error('Free credits update error:', updateFreeError)
      return NextResponse.json(
        { error: 'Failed to update free credits' },
        { status: 500 }
      )
    }

    // Log the usage
    await supabase
      .from('credit_usage_log')
      .insert({
        user_id: userId,
        action_type: credits === 1 ? 'score' : 'generate',
        credits_used: credits,
        credits_remaining: newFreeCredits,
        details: { plan: 'free' }
      })

    return NextResponse.json({ 
      success: true, 
      creditsRemaining: newFreeCredits,
      freeTier: true
    })

  } catch (error: any) {
    console.error('Credit deduction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 