#!/usr/bin/env bash
# scripts/smoke-test.sh — fast prod readiness check.
#
# Hits ~30 endpoints with curl, asserts expected status codes, and reports
# PASS/FAIL. Use after every push to verify Vercel deploy didn't break
# anything reachable without auth.
#
# Override BASE_URL to retarget:
#   BASE_URL=http://localhost:3000 bash scripts/smoke-test.sh
#
# For deeper interactive tests (clicks, form submits, add-to-cart) run:
#   npx playwright test tests/e2e/site-walkthrough.spec.ts

set -e

BASE="${BASE_URL:-https://horecom-platform-eosin.vercel.app}"
PASS=0
FAIL=0
FAILED_URLS=()

check() {
  local url="$1"
  local expect="$2"
  local code
  code=$(curl -sS -o /dev/null --max-time 30 -w "%{http_code}" "$BASE$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expect" ]; then
    PASS=$((PASS+1))
    printf "  ✓ %-50s %s\n" "$url" "$code"
  else
    FAIL=$((FAIL+1))
    FAILED_URLS+=("$url → $code (expected $expect)")
    printf "  ✗ %-50s got=%s expected=%s\n" "$url" "$code" "$expect"
  fi
}

echo "===== Horecom smoke test ($BASE) ====="
echo

echo "[1/6] Infrastructure"
check /api/healthz 200

echo
echo "[2/6] Marketing (RU)"
check /ru 200
check /ru/catalog 200
check /ru/catalog?category=syrups 200
check /ru/catalog?q=DECOL 200
check /ru/subscription 200
check /ru/group-buying 200
check /ru/about 200
check /ru/faq 200
check /ru/delivery-and-payment 200
check /ru/privacy 200
check /ru/how-ordering-works 200
check /ru/product/mindalnaya-muka-ispaniya-1kg 200

echo
echo "[3/6] Marketing (KZ fallback)"
check /kz 200
check /kz/catalog 200

echo
echo "[4/6] Auth-gated → redirect to /login"
check /cart 307
check /checkout 307
check /orders 307
check /profile 307
check /dashboard 307
check /onboarding 307
check /admin 307
check /login 200

echo
echo "[5/6] AI surfaces"
check /api/mcp/manifest.json 200
check /api/mcp/tools 200
check /.well-known/ai-plugin.json 200
check /llms.txt 200
check /robots.txt 200
check /sitemap.xml 200

echo
echo "[6/6] PWA icons + manifest"
check /favicon.ico 200
check /favicon.png 200
check /icon.png 200
check /apple-icon.png 200
check /apple-touch-icon.png 200
check /icon-192.png 200
check /icon-512.png 200
check /manifest.webmanifest 200

echo
echo "[7/7] API auth gates (401 expected without secret)"
check /api/cron/subscription-reminders 401

# MCP bad args returns 400 not 500
echo
echo "[bonus] MCP returns 400 on invalid args"
MCP_CODE=$(curl -sS -o /dev/null --max-time 30 -w "%{http_code}" -X POST "$BASE/api/mcp/call" \
  -H "content-type: application/json" \
  -d '{"tool_name":"search_products","arguments":{"query":"a","max_results":999}}')
if [ "$MCP_CODE" = "400" ]; then
  PASS=$((PASS+1))
  printf "  ✓ %-50s %s\n" "POST /api/mcp/call max_results=999" "$MCP_CODE"
else
  FAIL=$((FAIL+1))
  FAILED_URLS+=("POST /api/mcp/call max_results=999 → $MCP_CODE (expected 400)")
  printf "  ✗ %-50s got=%s expected=400\n" "POST /api/mcp/call max_results=999" "$MCP_CODE"
fi

echo
echo "===== Results: $PASS PASS, $FAIL FAIL ====="
if [ "$FAIL" -gt 0 ]; then
  echo
  echo "Failures:"
  for f in "${FAILED_URLS[@]}"; do echo "  $f"; done
  exit 1
fi
exit 0
