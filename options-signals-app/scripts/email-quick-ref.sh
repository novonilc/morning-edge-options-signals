#!/bin/bash
# Quick reference for common email commands

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Morning Edge - Email Quick Reference${NC}"
echo ""

# Show environment setup
echo -e "${GREEN}1. Environment Setup${NC}"
echo "   cp .env.local.example .env.local"
echo "   # Edit with your Resend API key and email"
echo ""

# Show local testing commands
echo -e "${GREEN}2. Local Testing${NC}"
echo "   npm run dev"
echo ""
echo "   # In another terminal:"
echo "   bash scripts/test-email.sh"
echo ""
echo "   # Or manually:"
echo "   curl -X POST http://localhost:3000/api/admin/test-email"
echo "   curl -X POST 'http://localhost:3000/api/cron/send-signals?force=true'"
echo ""

# Show Vercel deployment
echo -e "${GREEN}3. Vercel Deployment${NC}"
echo "   cp vercel.json.example vercel.json"
echo "   git add vercel.json .env.local"
echo "   git push"
echo ""

# Show environment variables
echo -e "${GREEN}4. Required Environment Variables${NC}"
echo "   RESEND_API_KEY=<your-api-key>"
echo "   EMAIL_TO=your.email@example.com"
echo ""
echo "   Optional:"
echo "   EMAIL_FROM=noreply@yourdomain.com"
echo "   CRON_SECRET=<random-secret>"
echo "   ADMIN_TOKEN=<random-token>"
echo ""

# Show cron endpoints
echo -e "${GREEN}5. API Endpoints${NC}"
echo "   GET  /api/cron/send-signals         - Check status and time window"
echo "   POST /api/cron/send-signals         - Send email (requires CRON_SECRET)"
echo "   POST /api/cron/send-signals?force=true - Send immediately"
echo "   POST /api/admin/test-email          - Send test email"
echo ""

# Show logs
echo -e "${GREEN}6. Check Logs${NC}"
echo "   Vercel:     https://vercel.com/dashboard"
echo "   Local:      npm run dev (server output)"
echo "   Resend:     https://resend.com/emails"
echo ""
