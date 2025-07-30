import { NextRequest, NextResponse } from 'next/server';
import { stripe, HANDLED_WEBHOOK_EVENTS, mapStripeSubscriptionStatus } from '@/lib/stripe/config';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing stripe signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Received webhook: ${event.type}`);

    // Only process events we handle
    if (!HANDLED_WEBHOOK_EVENTS.includes(event.type as any)) {
      console.log(`Unhandled webhook event: ${event.type}`);
      return NextResponse.json({ received: true });
    }

    // Process the event
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleTrialWillEnd(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(customer);
        break;
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerUpdated(customer);
        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        await handlePaymentMethodAttached(paymentMethod);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Webhook event handlers
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  // TODO: Update user subscription status in database
  const userId = subscription.metadata.userId;
  const subscriptionTier = subscription.metadata.subscriptionTier;
  
  if (userId && subscriptionTier) {
    // Mock database update - replace with actual database logic
    console.log(`User ${userId} subscribed to ${subscriptionTier}`);
    
    // Send welcome email
    await sendEmail('subscription_welcome', {
      userId,
      subscriptionTier,
      trialEnd: subscription.trial_end,
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const userId = subscription.metadata.userId;
  const status = mapStripeSubscriptionStatus(subscription.status);
  
  if (userId) {
    // Mock database update - replace with actual database logic
    console.log(`User ${userId} subscription status: ${status}`);
    
    // If subscription became active after trial
    if (subscription.status === 'active' && !subscription.trial_end) {
      await sendEmail('subscription_activated', {
        userId,
        subscriptionId: subscription.id,
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const userId = subscription.metadata.userId;
  
  if (userId) {
    // Mock database update - replace with actual database logic
    console.log(`User ${userId} subscription canceled`);
    
    // Send cancellation confirmation email
    await sendEmail('subscription_canceled', {
      userId,
      subscriptionId: subscription.id,
      endDate: subscription.ended_at,
    });
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log('Trial will end:', subscription.id);
  
  const userId = subscription.metadata.userId;
  
  if (userId && subscription.trial_end) {
    const trialEndDate = new Date(subscription.trial_end * 1000);
    
    // Send trial ending reminder email
    await sendEmail('trial_ending', {
      userId,
      trialEndDate,
      subscriptionId: subscription.id,
    });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const userId = subscription.metadata.userId;
    
    if (userId) {
      // Send payment receipt email
      await sendEmail('payment_receipt', {
        userId,
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        paidAt: invoice.status_transitions.paid_at,
      });
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const userId = subscription.metadata.userId;
    
    if (userId) {
      // Send payment failed email
      await sendEmail('payment_failed', {
        userId,
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        nextAttempt: invoice.next_payment_attempt,
      });
    }
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id);
  
  // TODO: Store customer data in database
  const userId = customer.metadata.userId;
  
  if (userId) {
    console.log(`Customer created for user ${userId}`);
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id);
  
  // TODO: Update customer data in database
  const userId = customer.metadata.userId;
  
  if (userId) {
    console.log(`Customer updated for user ${userId}`);
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method attached:', paymentMethod.id);
  
  // TODO: Store payment method info in database if needed
  if (paymentMethod.customer) {
    console.log(`Payment method attached to customer ${paymentMethod.customer}`);
  }
}

// Mock email service - replace with actual email implementation
async function sendEmail(template: string, data: any) {
  console.log(`Mock email sent: ${template}`, data);
  
  // TODO: Implement actual email sending using your preferred service
  // Examples: SendGrid, Mailgun, AWS SES, etc.
  
  // For development, just log the email that would be sent
  const emailTemplates = {
    subscription_welcome: `Welcome to Premium! Your trial ends on ${new Date(data.trialEnd * 1000).toLocaleDateString()}`,
    subscription_activated: `Your Premium subscription is now active!`,
    subscription_canceled: `Your subscription has been canceled. Access continues until ${new Date(data.endDate * 1000).toLocaleDateString()}`,
    trial_ending: `Your free trial ends on ${data.trialEndDate.toLocaleDateString()}`,
    payment_receipt: `Payment of ${data.amount / 100} ${data.currency.toUpperCase()} received`,
    payment_failed: `Payment failed. We'll retry automatically.`,
  };
  
  const emailContent = emailTemplates[template as keyof typeof emailTemplates];
  console.log(`Email content: ${emailContent}`);
}