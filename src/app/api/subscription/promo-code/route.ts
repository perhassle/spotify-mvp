import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionTier, PromoCode } from '@/types';

// Mock promo codes - in production, these would be stored in database
const MOCK_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo_1',
    code: 'STUDENT50',
    name: 'Student Discount',
    discountType: 'percentage',
    discountValue: 50,
    duration: 'forever',
    maxRedemptions: 1000,
    currentRedemptions: 156,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    applicableTiers: ['premium'],
    firstTimeOnly: true,
    active: true,
  },
  {
    id: 'promo_2',
    code: 'WELCOME20',
    name: 'Welcome Offer',
    discountType: 'percentage',
    discountValue: 20,
    duration: 'repeating',
    durationInMonths: 3,
    maxRedemptions: 5000,
    currentRedemptions: 1234,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    applicableTiers: ['premium', 'family'],
    firstTimeOnly: true,
    active: true,
  },
  {
    id: 'promo_3',
    code: 'SAVE5',
    name: '$5 Off',
    discountType: 'amount',
    discountValue: 5.00,
    duration: 'once',
    maxRedemptions: 500,
    currentRedemptions: 89,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-06-30'),
    applicableTiers: ['premium', 'family'],
    firstTimeOnly: false,
    active: true,
  },
  {
    id: 'promo_4',
    code: 'FAMILY15',
    name: 'Family Plan Discount',
    discountType: 'percentage',
    discountValue: 15,
    duration: 'repeating',
    durationInMonths: 6,
    maxRedemptions: 1000,
    currentRedemptions: 234,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    applicableTiers: ['family'],
    firstTimeOnly: false,
    active: true,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subscriptionTier, billingPeriod } = body;

    if (!code || !subscriptionTier) {
      return NextResponse.json(
        { error: 'Code and subscription tier are required' },
        { status: 400 }
      );
    }

    // Find promo code (case-insensitive)
    const promoCode = MOCK_PROMO_CODES.find(
      promo => promo.code.toLowerCase() === code.toLowerCase() && promo.active
    );

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 404 }
      );
    }

    // Check if promo code is valid for the subscription tier
    if (!promoCode.applicableTiers.includes(subscriptionTier as SubscriptionTier)) {
      return NextResponse.json(
        { error: `This promo code is not valid for ${subscriptionTier} plan` },
        { status: 400 }
      );
    }

    // Check if promo code is still valid (date range)
    const now = new Date();
    if (now < promoCode.validFrom) {
      return NextResponse.json(
        { error: 'This promo code is not yet active' },
        { status: 400 }
      );
    }

    if (promoCode.validUntil && now > promoCode.validUntil) {
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 400 }
      );
    }

    // Check redemption limits
    if (promoCode.maxRedemptions && promoCode.currentRedemptions >= promoCode.maxRedemptions) {
      return NextResponse.json(
        { error: 'This promo code has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check if user has already used this promo (if first time only)
    if (promoCode.firstTimeOnly) {
      // In production, check against user's promo code usage history
      // For demo, we'll skip this check
    }

    return NextResponse.json({
      success: true,
      promo: {
        id: promoCode.id,
        code: promoCode.code,
        name: promoCode.name,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        duration: promoCode.duration,
        durationInMonths: promoCode.durationInMonths,
      },
      message: 'Promo code applied successfully',
    });

  } catch (error) {
    console.error('Promo code validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}

// GET - List available promo codes (admin only)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tier = url.searchParams.get('tier') as SubscriptionTier;
    const active = url.searchParams.get('active') !== 'false';

    let promoCodes = MOCK_PROMO_CODES;

    // Filter by tier if specified
    if (tier) {
      promoCodes = promoCodes.filter(promo => 
        promo.applicableTiers.includes(tier)
      );
    }

    // Filter by active status
    if (active) {
      promoCodes = promoCodes.filter(promo => promo.active);
    }

    // Filter out expired codes
    const now = new Date();
    promoCodes = promoCodes.filter(promo => 
      !promo.validUntil || now <= promo.validUntil
    );

    return NextResponse.json({
      promoCodes: promoCodes.map(promo => ({
        id: promo.id,
        code: promo.code,
        name: promo.name,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        duration: promo.duration,
        durationInMonths: promo.durationInMonths,
        applicableTiers: promo.applicableTiers,
        validFrom: promo.validFrom,
        validUntil: promo.validUntil,
        maxRedemptions: promo.maxRedemptions,
        currentRedemptions: promo.currentRedemptions,
        firstTimeOnly: promo.firstTimeOnly,
        active: promo.active,
      })),
    });

  } catch (error) {
    console.error('Get promo codes error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve promo codes' },
      { status: 500 }
    );
  }
}