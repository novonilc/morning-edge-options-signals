# Email Notifications Deployment Guide

This guide explains how to set up daily email notifications for trading signals.

## Overview

- **Schedule**: Every morning between 5AM - 6:30AM PST
- **Content**: Top 10 signals + market regime snapshot
- **Service**: [Resend](https://resend.com) (email delivery)
- **Trigger**: Vercel Cron, external cron service, or manual API calls

## Step 1: Get Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Create a project (or use default)
3. Copy your API key from the dashboard
4. Add a sending domain (or use trial@resend.dev for testing)

## Step 2: Set Environment Variables

Create or update `.env.local`:

```bash
# Required for email
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_TO=your.email@example.com
EMAIL_FROM=noreply@yourdomain.com

# Optional but recommended
EMAIL_REPLY_TO=support@yourdomain.com
CRON_SECRET=your_secret_cron_token
ADMIN_TOKEN=your_admin_token
APP_URL=https://yourdomain.com
```

### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Your Resend API key from https://resend.com |
| `EMAIL_TO` | Yes | Email address to send signals to |
| `EMAIL_FROM` | No | Sender email (default: noreply@morningedge.io) |
| `EMAIL_REPLY_TO` | No | Reply-to email address |
| `CRON_SECRET` | No | Secret for cron endpoint security |
| `ADMIN_TOKEN` | No | Secret for admin endpoints (test email) |
| `APP_URL` | No | Your app URL (used in email links) |

## Step 3: Choose Cron Trigger Method

### Option A: Vercel Cron (Recommended for Vercel Deployments)

1. Copy `vercel.json.example` to `vercel.json`:
```bash
cp vercel.json.example vercel.json
```

2. Push to your Vercel project
3. The cron will automatically trigger at 5:00 AM every weekday (UTC schedule converted to PST)

**Note**: The schedule `"0 5-6 * * MON-FRI"` triggers at 5:00 AM UTC. Adjust this based on your timezone needs.

### Option B: External Cron Service

Use [cron-job.org](https://cron-job.org), [EasyCron](https://www.easycron.com), or similar services:

1. Go to the cron service website
2. Create a new cron job with these settings:
   - **URL**: `https://yourdomain.com/api/cron/send-signals`
   - **Method**: POST
   - **Headers**:
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     Content-Type: application/json
     ```
   - **Schedule**: `0 5 * * MON-FRI` (5:00 AM PST, weekdays)

### Option C: GitHub Actions

Create `.github/workflows/send-signals.yml`:

```yaml
name: Send Trading Signals

on:
  schedule:
    - cron: '0 13 * * MON-FRI'  # 5 AM PST = 1 PM UTC

jobs:
  send-signals:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger email send
        run: |
          curl -X POST https://yourdomain.com/api/cron/send-signals \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

Then add `CRON_SECRET` to your GitHub repository secrets.

### Option D: AWS Lambda + CloudWatch

1. Create a Lambda function that makes a POST request to your endpoint
2. Create a CloudWatch Event Rule to trigger it daily at 5 AM PST
3. Set Lambda as the target

## Step 4: Test Locally

```bash
# Start development server
npm run dev

# In another terminal, test email delivery
curl -X POST http://localhost:3000/api/admin/test-email

# Force send a signals email (bypasses time window check)
curl -X POST "http://localhost:3000/api/cron/send-signals?force=true"

# Check current status and time window
curl http://localhost:3000/api/cron/send-signals
```

Or use the provided test script:

```bash
# Without authentication
bash scripts/test-email.sh

# With authentication tokens
ADMIN_TOKEN=your_token bash scripts/test-email.sh http://localhost:3000
```

## Step 5: Verify on Production

1. Deploy to production (Vercel, self-hosted, etc.)
2. Set all environment variables in production settings
3. Test the email endpoint:
   ```bash
   curl -X POST https://yourdomain.com/api/cron/send-signals?force=true \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
4. Wait for the next scheduled time or force send with `?force=true`

## Email Content

### What's Included

- **Header**: Date and "Morning Edge" branding
- **Market Regime**: Current SPX change, VIX, market regime
- **Top 10 Signals**: Ranked by conviction score
  - Ticker, strategy, price, conviction level, probability of profit
- **Call to Action**: Link to dashboard
- **Footer**: Trading disclaimer

### Customization

Edit the HTML generation in `src/lib/email-service.ts`:

```typescript
private generateSignalHTML(
  signals: Signal[],
  regime: MarketRegime,
  generatedAt: string
): string {
  // Customize HTML template here
}
```

## Troubleshooting

### Email not sending

1. **Check environment variables**:
   ```bash
   echo $RESEND_API_KEY
   echo $EMAIL_TO
   ```

2. **Test API key**:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -d '{"from":"test@resend.dev","to":"your.email@example.com","subject":"Test","html":"<h1>Test</h1>"}'
   ```

3. **Check server logs**:
   - Vercel: Dashboard → Logs
   - Self-hosted: Check application logs

### Email arrives but looks wrong

- Emails from Resend trial domain may have "On behalf of" message
- Use a verified domain for production
- Check email client's spam folder

### Cron not triggering

1. **Vercel Cron**: Check Vercel dashboard → Cron Jobs
2. **External service**: Confirm URL is correct and publicly accessible
3. **Time zone**: Verify PST conversion (PST is UTC-8 or UTC-7 in DST)

### Time window issues

The endpoint checks if current time is within 5:00 AM - 6:30 AM PST:
- During daylight saving time, PST becomes PDT (UTC-7)
- The endpoint handles this automatically
- Use `?force=true` to bypass time window check for testing

## Security Considerations

1. **CRON_SECRET**: Use a long, random string
   ```bash
   openssl rand -hex 32
   ```

2. **ADMIN_TOKEN**: Different from CRON_SECRET for admin endpoints

3. **Email addresses**: Don't expose in client-side code (only in .env)

4. **API keys**: Never commit `.env.local` to git (add to `.gitignore`)

## Cost Estimates

- **Resend**: Free for first 100 emails/day
- **Vercel Cron**: Included with Vercel deployments
- **External Cron**: Most services have free tier for 1 daily job

## Next Steps

1. Monitor email delivery success/failure
2. Adjust signal count in email (limit to top N signals)
3. Add more customization (logos, colors, additional data)
4. Consider adding unsubscribe link as required by regulations
5. Set up bounce/complaint handling with Resend webhooks

## References

- [Resend Documentation](https://resend.com/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
