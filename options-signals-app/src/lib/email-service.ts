/**
 * Email service for sending trading signals
 * Uses Resend for email delivery
 */

import type { Signal, MarketRegime } from './types';

// Try to import Resend, but make it optional
let Resend: any = null;
try {
  Resend = require('resend').Resend;
} catch (error) {
  console.warn('Resend not installed. Email sending will be disabled. Install with: npm install resend');
}

export interface EmailConfig {
  fromEmail: string;
  toEmail: string;
  replyTo?: string;
}

export class EmailService {
  private static instance: EmailService;
  private config: EmailConfig | null = null;
  private client: any = null;

  private constructor() {
    this.initializeConfig();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeConfig(): void {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@morningedge.io';
    const toEmail = process.env.EMAIL_TO || '';

    if (!toEmail) {
      console.warn('EMAIL_TO environment variable not set. Email sending will be disabled.');
      return;
    }

    if (!apiKey && Resend) {
      console.warn('RESEND_API_KEY environment variable not set. Email sending will be disabled.');
      return;
    }

    this.config = {
      fromEmail,
      toEmail,
      replyTo: process.env.EMAIL_REPLY_TO,
    };

    if (Resend && apiKey) {
      this.client = new Resend(apiKey);
      console.log('Email service initialized with Resend');
    }
  }

  /**
   * Check if email service is properly configured
   */
  isEnabled(): boolean {
    return this.config !== null && this.client !== null;
  }

  /**
   * Generate HTML email content for signals
   */
  private generateSignalHTML(
    signals: Signal[],
    regime: MarketRegime,
    generatedAt: string
  ): string {
    const strategyIcon: Record<string, string> = {
      bull_call_spread: '📈',
      bear_put_spread: '📉',
      iron_condor: '⚖️',
      credit_put_spread: '💰',
      credit_call_spread: '💰',
      long_straddle: '🎯',
      long_strangle: '🎯',
      short_strangle: '🎯',
    };

    const signalRows = signals
      .slice(0, 10) // Limit to top 10 signals
      .map(
        (signal) => `
        <tr style="border-bottom: 1px solid #eee; padding: 12px 0;">
          <td style="padding: 12px; font-weight: 600; color: #1a1a1a;">${signal.ticker}</td>
          <td style="padding: 12px;">${strategyIcon[signal.strategy] || '📊'} ${signal.strategy.replace(/_/g, ' ')}</td>
          <td style="padding: 12px; color: #666;">$${signal.underlyingPrice.toFixed(2)}</td>
          <td style="padding: 12px; text-align: center;">
            <span style="background: ${signal.conviction === 'high' ? '#10b981' : signal.conviction === 'medium' ? '#f59e0b' : '#ef4444'}; 
                         color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${signal.conviction.toUpperCase()}
            </span>
          </td>
          <td style="padding: 12px; text-align: right; color: #666;">${(signal.probabilityOfProfit * 100).toFixed(0)}%</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 8px 0 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .regime-strip { background: #f3f4f6; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 24px; border-radius: 4px; }
            .regime-strip h3 { margin: 0 0 12px 0; color: #667eea; font-size: 14px; text-transform: uppercase; font-weight: 600; }
            .regime-item { display: inline-block; margin-right: 20px; }
            .regime-item-label { font-size: 12px; color: #666; }
            .regime-item-value { font-size: 16px; font-weight: 600; color: #1a1a1a; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Morning Edge</h1>
              <p>Options Trading Signals · ${new Date(generatedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            
            <div class="content">
              <div class="regime-strip">
                <h3>Market Regime</h3>
                <div class="regime-item">
                  <div class="regime-item-label">Regime</div>
                  <div class="regime-item-value">${regime.regime.replace(/_/g, ' ').toUpperCase()}</div>
                </div>
                <div class="regime-item">
                  <div class="regime-item-label">SPX Change</div>
                  <div class="regime-item-value" style="color: ${regime.spxChange >= 0 ? '#10b981' : '#ef4444'}">
                    ${regime.spxChange >= 0 ? '+' : ''}${regime.spxChange}%
                  </div>
                </div>
                <div class="regime-item">
                  <div class="regime-item-label">VIX</div>
                  <div class="regime-item-value">${regime.vix.toFixed(1)}</div>
                </div>
              </div>

              <h2 style="margin-top: 0; font-size: 20px; color: #1a1a1a;">Top Signals (${signals.length} total)</h2>
              
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Strategy</th>
                    <th>Price</th>
                    <th>Conviction</th>
                    <th>POP</th>
                  </tr>
                </thead>
                <tbody>
                  ${signalRows}
                </tbody>
              </table>

              <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="cta">View Full Dashboard</a>
            </div>

            <div class="footer">
              <p>Morning Edge · Options Trading Signals</p>
              <p style="color: #999; margin-top: 12px; font-size: 11px;">
                This email contains trading signals for informational purposes. Always do your own research before trading.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send signals email
   */
  async sendSignalsEmail(
    signals: Signal[],
    regime: MarketRegime,
    generatedAt: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: 'Email service not configured. Set RESEND_API_KEY and EMAIL_TO environment variables.',
      };
    }

    if (!this.config) {
      return { success: false, error: 'Email config not initialized' };
    }

    try {
      const htmlContent = this.generateSignalHTML(signals, regime, generatedAt);

      const response = await this.client.emails.send({
        from: this.config.fromEmail,
        to: this.config.toEmail,
        reply_to: this.config.replyTo,
        subject: `Morning Edge · ${signals.length} Trading Signals · ${new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        html: htmlContent,
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, messageId: response.data?.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const response = await this.client.emails.send({
        from: this.config.fromEmail,
        to: this.config.toEmail,
        subject: 'Morning Edge · Test Email',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from Morning Edge.</p>
          <p>If you received this, email delivery is working correctly!</p>
        `,
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, messageId: response.data?.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}

export const emailService = EmailService.getInstance();
