#!/bin/bash
# Quick setup script for email notifications

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Morning Edge - Email Setup${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}Creating .env.local from template...${NC}"
  cp .env.local.example .env.local
  echo "✓ Created .env.local"
else
  echo "✓ .env.local already exists"
fi

# Check if Resend is installed
if ! npm list resend &> /dev/null; then
  echo ""
  echo -e "${YELLOW}Installing Resend...${NC}"
  npm install resend
fi

echo ""
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Get your Resend API key from https://resend.com"
echo "2. Update .env.local with:"
echo "   - RESEND_API_KEY=your_api_key"
echo "   - EMAIL_TO=your.email@example.com"
echo ""
echo "To test email delivery:"
echo "   npm run dev"
echo "   curl -X POST http://localhost:3000/api/admin/test-email"
echo ""
echo "To send signals manually (bypassing time window):"
echo "   curl -X POST 'http://localhost:3000/api/cron/send-signals?force=true'"
echo ""
