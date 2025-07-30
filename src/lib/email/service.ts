import nodemailer from 'nodemailer';
import { formatPrice } from '@/lib/stripe/config';

/**
 * Email service for subscription-related communications
 * This is a mock implementation for development - replace with your preferred email service
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SubscriptionEmailData {
  userEmail: string;
  userName?: string;
  subscriptionTier: string;
  amount?: number;
  currency?: string;
  trialEndDate?: Date;
  billingDate?: Date;
  invoiceUrl?: string;
}

// Create transporter (mock configuration)
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // For development, use a test account or console logging
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

class EmailService {
  /**
   * Send email (mock implementation for development)
   */
  private static async sendEmail(options: EmailOptions): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // In development, just log the email content
      console.log('📧 Mock Email Sent:');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content: ${options.text || 'HTML content'}`);
      console.log('---');
      return;
    }

    if (!transporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send welcome email for new premium subscribers
   */
  static async sendWelcomeEmail(data: SubscriptionEmailData): Promise<void> {
    const subject = `Welcome to ${data.subscriptionTier} - Your music journey starts now!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Premium</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #1f2937; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .feature { display: flex; align-items: center; margin: 15px 0; }
            .feature-icon { color: #10b981; margin-right: 10px; }
            .cta-button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .trial-info { background: #eff6ff; padding: 20px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 Welcome to ${data.subscriptionTier}!</h1>
              <p>Your premium music experience starts now</p>
            </div>
            
            <div class="content">
              <p>Hi ${data.userName || 'Music Lover'},</p>
              
              <p>Welcome to the premium music streaming experience! You now have access to all our premium features:</p>
              
              <div class="feature">
                <span class="feature-icon">✓</span>
                <span>Ad-free music streaming</span>
              </div>
              <div class="feature">
                <span class="feature-icon">✓</span>
                <span>Unlimited skips</span>
              </div>
              <div class="feature">
                <span class="feature-icon">✓</span>
                <span>High-quality audio (320kbps)</span>
              </div>
              <div class="feature">
                <span class="feature-icon">✓</span>
                <span>Offline downloads</span>
              </div>
              <div class="feature">
                <span class="feature-icon">✓</span>
                <span>Advanced equalizer</span>
              </div>
              
              ${data.trialEndDate ? `
                <div class="trial-info">
                  <h3>🎁 Your Free Trial</h3>
                  <p>Your 7-day free trial is active until <strong>${data.trialEndDate.toLocaleDateString()}</strong>. You can cancel anytime before then without being charged.</p>
                </div>
              ` : ''}
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="cta-button">Start Listening</a>
              
              <p>If you have any questions, our support team is here to help!</p>
              
              <p>Happy listening!<br>The Spotify MVP Team</p>
            </div>
            
            <div class="footer">
              <p><small>You received this email because you subscribed to ${data.subscriptionTier}.</small></p>
              <p><small><a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription/manage">Manage your subscription</a></small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to ${data.subscriptionTier}!
      
      Hi ${data.userName || 'Music Lover'},
      
      Welcome to the premium music streaming experience! You now have access to:
      
      ✓ Ad-free music streaming
      ✓ Unlimited skips
      ✓ High-quality audio (320kbps)
      ✓ Offline downloads
      ✓ Advanced equalizer
      
      ${data.trialEndDate ? `Your 7-day free trial is active until ${data.trialEndDate.toLocaleDateString()}. You can cancel anytime before then without being charged.` : ''}
      
      Start listening: ${process.env.NEXT_PUBLIC_APP_URL}
      
      Happy listening!
      The Spotify MVP Team
    `;

    await this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send payment receipt email
   */
  static async sendPaymentReceipt(data: SubscriptionEmailData): Promise<void> {
    const subject = `Payment Receipt - ${formatPrice(data.amount || 0, data.currency)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .receipt-box { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Received</h1>
              <p>Thank you for your payment</p>
            </div>
            
            <div class="content">
              <p>Hi ${data.userName || 'Valued Customer'},</p>
              
              <p>We've successfully processed your payment for your ${data.subscriptionTier} subscription.</p>
              
              <div class="receipt-box">
                <div class="amount">${formatPrice(data.amount || 0, data.currency)}</div>
                <p style="text-align: center; margin: 10px 0;">
                  <strong>${data.subscriptionTier} Subscription</strong><br>
                  ${data.billingDate ? `Billing Date: ${data.billingDate.toLocaleDateString()}` : ''}
                </p>
              </div>
              
              ${data.invoiceUrl ? `<p><a href="${data.invoiceUrl}">Download Invoice</a></p>` : ''}
              
              <p>Your premium features will continue uninterrupted. Thank you for being a valued subscriber!</p>
              
              <p>Questions? Contact our support team anytime.</p>
              
              <p>Best regards,<br>The Spotify MVP Team</p>
            </div>
            
            <div class="footer">
              <p><small>This is your payment receipt for ${data.subscriptionTier} subscription.</small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Payment Receipt
      
      Hi ${data.userName || 'Valued Customer'},
      
      We've successfully processed your payment for your ${data.subscriptionTier} subscription.
      
      Amount: ${formatPrice(data.amount || 0, data.currency)}
      Service: ${data.subscriptionTier} Subscription
      ${data.billingDate ? `Billing Date: ${data.billingDate.toLocaleDateString()}` : ''}
      
      ${data.invoiceUrl ? `Download Invoice: ${data.invoiceUrl}` : ''}
      
      Your premium features will continue uninterrupted. Thank you for being a valued subscriber!
      
      Best regards,
      The Spotify MVP Team
    `;

    await this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send trial ending reminder
   */
  static async sendTrialEndingReminder(data: SubscriptionEmailData): Promise<void> {
    const subject = 'Your free trial ends soon - Don\'t lose your premium features!';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial Ending Soon</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .warning-box { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .cta-button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Trial Ending Soon</h1>
              <p>Don't lose your premium features</p>
            </div>
            
            <div class="content">
              <p>Hi ${data.userName || 'Music Lover'},</p>
              
              <div class="warning-box">
                <h3>Your free trial ends ${data.trialEndDate ? `on ${data.trialEndDate.toLocaleDateString()}` : 'soon'}!</h3>
                <p>After your trial ends, you'll lose access to premium features like ad-free listening, unlimited skips, and high-quality audio.</p>
              </div>
              
              <p>Continue enjoying premium features:</p>
              <ul>
                <li>✓ Ad-free music streaming</li>
                <li>✓ Unlimited skips</li>
                <li>✓ High-quality audio (320kbps)</li>
                <li>✓ Offline downloads</li>
                <li>✓ Advanced equalizer</li>
              </ul>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription/manage" class="cta-button">Keep Premium Features</a>
              
              <p>If you decide premium isn't for you, no worries! You can cancel anytime and continue with our free plan.</p>
              
              <p>Thanks for trying premium!<br>The Spotify MVP Team</p>
            </div>
            
            <div class="footer">
              <p><small><a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription/manage">Manage your subscription</a> | <a href="#">Cancel anytime</a></small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Trial Ending Soon
      
      Hi ${data.userName || 'Music Lover'},
      
      Your free trial ends ${data.trialEndDate ? `on ${data.trialEndDate.toLocaleDateString()}` : 'soon'}!
      
      After your trial ends, you'll lose access to premium features like ad-free listening, unlimited skips, and high-quality audio.
      
      Continue enjoying premium features:
      ✓ Ad-free music streaming
      ✓ Unlimited skips
      ✓ High-quality audio (320kbps)
      ✓ Offline downloads
      ✓ Advanced equalizer
      
      Keep Premium Features: ${process.env.NEXT_PUBLIC_APP_URL}/subscription/manage
      
      If you decide premium isn't for you, no worries! You can cancel anytime and continue with our free plan.
      
      Thanks for trying premium!
      The Spotify MVP Team
    `;

    await this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send subscription cancellation confirmation
   */
  static async sendCancellationConfirmation(data: SubscriptionEmailData): Promise<void> {
    const subject = 'Subscription Cancelled - We\'ll miss you!';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #6b7280; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .info-box { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .cta-button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👋 Subscription Cancelled</h1>
              <p>We're sorry to see you go</p>
            </div>
            
            <div class="content">
              <p>Hi ${data.userName || 'Valued Customer'},</p>
              
              <p>We've successfully cancelled your ${data.subscriptionTier} subscription as requested.</p>
              
              <div class="info-box">
                <h3>What happens next?</h3>
                <p>• You'll continue to have premium access until ${data.billingDate ? data.billingDate.toLocaleDateString() : 'the end of your billing period'}</p>
                <p>• After that, you'll automatically switch to our free plan</p>
                <p>• You can reactivate your subscription anytime</p>
              </div>
              
              <p>We'd love to have you back! Here's what you'll be missing:</p>
              <ul>
                <li>Ad-free music streaming</li>
                <li>Unlimited skips</li>
                <li>High-quality audio</li>
                <li>Offline downloads</li>
              </ul>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" class="cta-button">Reactivate Subscription</a>
              
              <p>Thank you for being part of our community. We hope you'll consider premium again in the future!</p>
              
              <p>Best wishes,<br>The Spotify MVP Team</p>
            </div>
            
            <div class="footer">
              <p><small>You can reactivate your subscription anytime from your account settings.</small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Subscription Cancelled
      
      Hi ${data.userName || 'Valued Customer'},
      
      We've successfully cancelled your ${data.subscriptionTier} subscription as requested.
      
      What happens next?
      • You'll continue to have premium access until ${data.billingDate ? data.billingDate.toLocaleDateString() : 'the end of your billing period'}
      • After that, you'll automatically switch to our free plan
      • You can reactivate your subscription anytime
      
      We'd love to have you back! Here's what you'll be missing:
      - Ad-free music streaming
      - Unlimited skips
      - High-quality audio
      - Offline downloads
      
      Reactivate Subscription: ${process.env.NEXT_PUBLIC_APP_URL}/pricing
      
      Thank you for being part of our community. We hope you'll consider premium again in the future!
      
      Best wishes,
      The Spotify MVP Team
    `;

    await this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send payment failed notification
   */
  static async sendPaymentFailedNotification(data: SubscriptionEmailData): Promise<void> {
    const subject = 'Payment Failed - Update your payment method';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .cta-button { background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
              <p>Action required to keep your premium features</p>
            </div>
            
            <div class="content">
              <p>Hi ${data.userName || 'Valued Customer'},</p>
              
              <div class="alert-box">
                <h3>We couldn't process your payment</h3>
                <p>Your payment of ${formatPrice(data.amount || 0, data.currency)} for your ${data.subscriptionTier} subscription failed to process.</p>
              </div>
              
              <p>This could happen for several reasons:</p>
              <ul>
                <li>Insufficient funds</li>
                <li>Expired card</li>
                <li>Changed billing address</li>
                <li>Bank decline</li>
              </ul>
              
              <p><strong>Don't worry!</strong> We'll automatically retry your payment, but you can also update your payment method now to avoid any interruption to your service.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription/manage" class="cta-button">Update Payment Method</a>
              
              <p>If you need help, our support team is here to assist you.</p>
              
              <p>Thanks for your attention to this matter!<br>The Spotify MVP Team</p>
            </div>
            
            <div class="footer">
              <p><small>We'll continue trying to process your payment automatically.</small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Payment Failed - Action Required
      
      Hi ${data.userName || 'Valued Customer'},
      
      We couldn't process your payment of ${formatPrice(data.amount || 0, data.currency)} for your ${data.subscriptionTier} subscription.
      
      This could happen for several reasons:
      - Insufficient funds
      - Expired card
      - Changed billing address
      - Bank decline
      
      Don't worry! We'll automatically retry your payment, but you can also update your payment method now to avoid any interruption to your service.
      
      Update Payment Method: ${process.env.NEXT_PUBLIC_APP_URL}/subscription/manage
      
      If you need help, our support team is here to assist you.
      
      Thanks for your attention to this matter!
      The Spotify MVP Team
    `;

    await this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }
}

export default EmailService;