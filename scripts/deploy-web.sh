#!/usr/bin/env bash
# Builds the dashboard for one stack and uploads it.
# Usage: scripts/deploy-web.sh email-triage-staging
set -euo pipefail

STACK="$1"
REGION="eu-west-2"

# Read one output value from the stack, for example ApiUrl.
output() {
  aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

API_URL="$(output ApiUrl)"
BUCKET="$(output WebBucketName)"
DIST_ID="$(output DistributionId)"

# Vite bakes VITE_API_URL into the JavaScript at build time.
VITE_API_URL="$API_URL" npm --prefix web run build

# Upload the built files. --delete removes files that no longer exist locally.
aws s3 sync web/dist "s3://$BUCKET" --delete --region "$REGION"

# Tell CloudFront to stop serving its cached copies.
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" > /dev/null

echo "Dashboard deployed: $(output WebUrl)"