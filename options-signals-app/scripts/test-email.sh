#!/bin/bash
# Script to test email functionality locally

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="${1:-http://localhost:3000}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

echo -e "${BLUE}Morning Edge - Email Test Suite${NC}"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Check cron endpoint status
echo -e "${YELLOW}Test 1: Check cron endpoint status...${NC}"
curl -s "$BASE_URL/api/cron/send-signals" | jq . || echo "Failed to connect"
echo ""

# Test 2: Send test email
echo -e "${YELLOW}Test 2: Send test email...${NC}"
if [ -z "$ADMIN_TOKEN" ]; then
  echo "Sending without token..."
  curl -s -X POST "$BASE_URL/api/admin/test-email" | jq .
else
  curl -s -X POST "$BASE_URL/api/admin/test-email" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
fi
echo ""

# Test 3: Force send signals (bypasses time window)
echo -e "${YELLOW}Test 3: Force send signals via cron...${NC}"
if [ -z "$ADMIN_TOKEN" ]; then
  echo "Sending without token..."
  curl -s -X POST "$BASE_URL/api/cron/send-signals?force=true" | jq .
else
  curl -s -X POST "$BASE_URL/api/cron/send-signals?force=true" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
fi
echo ""

echo -e "${GREEN}✓ Email tests complete!${NC}"
echo ""
echo "To set ADMIN_TOKEN for authentication:"
echo "  ADMIN_TOKEN=your_token bash scripts/test-email.sh"
echo ""
