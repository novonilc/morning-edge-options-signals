/**
 * Cron endpoint to send morning signals via email
 * Triggers daily between 5AM - 6:30AM PST
 * 
 * Can be called by:
 * - Vercel Cron (if deployed on Vercel)
 * - External cron service (cron-job.org, EasyCron, etc.)
 * - Manual HTTP request
 * 
 * Example with curl:
 * curl -X POST http://localhost:3000/api/cron/send-signals \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *   -H "Content-Type: application/json"
 */

import { NextResponse, NextRequest } from 'next/server';
import { generateSignals, generateRegime } from '@/lib/mock/generator';
import { emailService } from '@/lib/email-service';

// Validate cron secret for security
function validateCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn(
      'CRON_SECRET not set. Cron endpoint is publicly accessible. Set CRON_SECRET for security.'
    );
    return true; // Allow if not configured (for development)
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === cronSecret;
}

/**
 * Check if current time is within sending window (5AM - 6:30AM PST)
 */
function isWithinSendingWindow(): boolean {
  // Convert current UTC time to PST (UTC-8, or UTC-7 during DST)
  const now = new Date();
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  
  const hours = pstTime.getHours();
  const minutes = pstTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // 5AM PST = 5*60 = 300 minutes
  // 6:30AM PST = 6*60 + 30 = 390 minutes
  const windowStart = 5 * 60; // 5:00 AM
  const windowEnd = 6.5 * 60; // 6:30 AM
  
  const isInWindow = totalMinutes >= windowStart && totalMinutes <= windowEnd;
  
  console.log(
    `Time check - PST: ${pstTime.toLocaleTimeString()} (${totalMinutes}min), In window: ${isInWindow}`
  );
  
  return isInWindow;
}

export async function POST(request: NextRequest) {
  try {
    // Validate cron secret
    if (!validateCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if force send is requested (for testing)
    const url = new URL(request.url);
    const forceSend = url.searchParams.get('force') === 'true';

    // Check if we're within sending window
    if (!forceSend && !isWithinSendingWindow()) {
      const pstTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      return NextResponse.json(
        {
          message: 'Outside sending window (5AM - 6:30AM PST)',
          currentTime: pstTime.toISOString(),
          window: '5:00 AM - 6:30 AM PST',
          skipped: true,
        },
        { status: 200 }
      );
    }

    // Check if email service is enabled
    if (!emailService.isEnabled()) {
      return NextResponse.json(
        {
          message: 'Email service not configured',
          hint: 'Set RESEND_API_KEY and EMAIL_TO environment variables',
        },
        { status: 200 }
      );
    }

    // Generate fresh signals
    const now = new Date();
    console.log('Generating signals for email...');
    const signals = await generateSignals(now, true); // Force refresh for latest data
    const regime = generateRegime(now);

    // Send email
    console.log(`Sending email with ${signals.length} signals to ${process.env.EMAIL_TO}`);
    const emailResult = await emailService.sendSignalsEmail(
      signals,
      regime,
      now.toISOString()
    );

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: emailResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Signals email sent successfully',
        messageId: emailResult.messageId,
        signalsCount: signals.length,
        sentAt: now.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing
 * Returns the current PST time and whether it's within sending window
 */
export async function GET(request: NextRequest) {
  const pstTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const isInWindow = isWithinSendingWindow();
  const isConfigured = emailService.isEnabled();

  return NextResponse.json(
    {
      currentTimeUTC: new Date().toISOString(),
      currentTimePST: pstTime.toISOString(),
      isWithinSendingWindow: isInWindow,
      sendingWindowPST: '5:00 AM - 6:30 AM',
      emailConfigured: isConfigured,
      cronSecretRequired: !!process.env.CRON_SECRET,
      note: 'POST to trigger email send (requires CRON_SECRET if configured). Add ?force=true to bypass time window check.',
    }
  );
}