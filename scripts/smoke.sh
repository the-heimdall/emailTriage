#!/usr/bin/env bash
# Quick proof that a deployed stack answers correctly.
# Usage: scripts/smoke.sh email-triage-staging
set -euo pipefail

STACK="$1"
API_URL="$(aws cloudformation describe-stacks --region eu-west-2 --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)"

# 1. The samples route returns 14 emails.
COUNT="$(curl -sf "$API_URL/api/samples" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).count))")"
[ "$COUNT" = "14" ] || { echo "FAIL: expected 14 samples, got $COUNT"; exit 1; }

# 2. A known debt email comes back as debt with a review flag.
RESULT="$(curl -sf -X POST "$API_URL/api/classify" -H 'content-type: application/json' \
  -d '{"emailId":"smoke-1","body":"I have lost my job and cannot afford my bill"}')"
echo "$RESULT" | grep -q '"category":"debt"' || { echo "FAIL: expected debt, got $RESULT"; exit 1; }

echo "PASS: $STACK answers correctly at $API_URL"
