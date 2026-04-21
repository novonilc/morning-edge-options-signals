/**
 * Admin endpoint to test email sending
 * Use this to verify email configuration is working
 */

import { NextResponse, NextRequest } from 'next/server';
import { emailService } from '@/lib/email-service';

function validateAdminToken(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    console.warn('ADMIN_TOKEN not set. Admin endpoints are publicly accessible.');
    return true; // Allow if not configured (for development)
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === adminToken;
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin token
    if (!validateAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await emailService.sendTestEmail();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}