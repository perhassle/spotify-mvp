import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

// GET - Retrieve subscription details
export async function GET(_request: NextRequest) {
  try {
    // Mock user authentication - in production, get from session
    const _userId = 'user_123'; // This should come from your auth system
    const userEmail = 'user@example.com'; // This should come from your auth system

    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10,
    });

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });

    // Get recent invoices
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 10,
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
      },
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date((sub as any).current_period_start * 1000),
        currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        trialStart: (sub as any).trial_start ? new Date((sub as any).trial_start * 1000) : null,
        trialEnd: (sub as any).trial_end ? new Date((sub as any).trial_end * 1000) : null,
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end || false,
        canceledAt: (sub as any).canceled_at ? new Date((sub as any).canceled_at * 1000) : null,
        items: sub.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
          quantity: item.quantity,
          amount: item.price.unit_amount,
          currency: item.price.currency,
          interval: item.price.recurring?.interval,
        })),
        metadata: sub.metadata,
      })),
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : null,
        billingDetails: pm.billing_details,
      })),
      invoices: invoices.data.map(inv => ({
        id: inv.id,
        status: inv.status,
        amount: inv.amount_paid,
        currency: inv.currency,
        created: inv.created,
        paidAt: inv.status_transitions.paid_at,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
      })),
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscription' },
      { status: 500 }
    );
  }
}

// PUT - Update subscription
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, action, ...params } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'Missing subscription ID or action' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'cancel':
        result = await cancelSubscription(subscriptionId, params);
        break;
      
      case 'reactivate':
        result = await reactivateSubscription(subscriptionId);
        break;
      
      case 'change_plan':
        result = await changePlan(subscriptionId, params);
        break;
      
      case 'update_payment_method':
        result = await updatePaymentMethod(subscriptionId, params);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// Helper functions
async function cancelSubscription(subscriptionId: string, params: any) {
  const { cancelAtPeriodEnd = true, reason } = params;

  if (cancelAtPeriodEnd) {
    // Cancel at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancellation_reason: reason || 'User requested',
      },
    });

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      },
      message: 'Subscription will be canceled at the end of the current period',
    };
  } else {
    // Cancel immediately
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        canceledAt: subscription.canceled_at,
      },
      message: 'Subscription canceled immediately',
    };
  }
}

async function reactivateSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return {
    success: true,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    message: 'Subscription reactivated successfully',
  };
}

async function changePlan(subscriptionId: string, params: any) {
  const { newPriceId } = params;

  if (!newPriceId) {
    throw new Error('New price ID is required');
  }

  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  if (!subscription.items.data[0]) {
    throw new Error('No subscription items found');
  }

  // Update subscription with new price
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations',
  });

  return {
    success: true,
    subscription: {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      items: updatedSubscription.items.data.map(item => ({
        priceId: item.price.id,
        amount: item.price.unit_amount,
        currency: item.price.currency,
      })),
    },
    message: 'Plan changed successfully',
  };
}

async function updatePaymentMethod(subscriptionId: string, params: any) {
  const { paymentMethodId } = params;

  if (!paymentMethodId) {
    throw new Error('Payment method ID is required');
  }

  // Get subscription to find customer
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Update customer's default payment method
  await stripe.customers.update(subscription.customer as string, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return {
    success: true,
    message: 'Payment method updated successfully',
  };
}