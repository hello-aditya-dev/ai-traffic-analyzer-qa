#!/usr/bin/env bash
# Build a clean release package ZIP for the AI Traffic Analyzer source-code product.
# Excludes node_modules, .git, .next, storage, secrets, local files, editor metadata.
set -euo pipefail

VERSION="1.0.0"
NAME="AI-Traffic-Analyzer"
OUT_DIR="dist"
STAGING="$OUT_DIR/$NAME-v$VERSION"

rm -rf "$STAGING" "$OUT_DIR/$NAME-v$VERSION.zip"
mkdir -p "$STAGING"

echo "→ Staging clean copy of source…"
rsync -a \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='out' \
  --exclude='dist' \
  --exclude='storage' \
  --exclude='db/*.db' \
  --exclude='db/*.db-journal' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='dev.log' \
  --exclude='server.log' \
  --exclude='tool-results' \
  --exclude='download' \
  --exclude='skills' \
  --exclude='.zscripts' \
  --exclude='Caddyfile' \
  --exclude='.DS_Store' \
  ./ "$STAGING/source/"

echo "→ Writing README-FIRST.txt…"
cat > "$STAGING/README-FIRST.txt" <<EOF
AI Traffic Analyzer v$VERSION
==============================

WHAT THIS IS
  A self-hosted, source-code-first AI traffic video analyzer. Convert traffic
  video into vehicle counts, classifications, tracking, directional flow, zone
  analytics, line crossings, configurable events and professional reports.
  Full source code included. Not a SaaS.

SYSTEM REQUIREMENTS
  - Node.js 20+ (or Bun)
  - 2 GB RAM minimum
  - 5 GB disk for uploads/outputs
  - Docker (optional, recommended for deployment)

QUICKEST INSTALLATION PATH
  1. cp source/.env.example source/.env
  2. cd source
  3. npm install && npx prisma db push && npm run db:seed && npm run dev
  4. Open http://localhost:3000

  OR with Docker:
  1. cd source
  2. cp .env.example .env
  3. docker compose up --build
  4. Open http://localhost:3000

WHERE TO CONFIGURE AI PROVIDER
  source/.env — set AI_PROVIDER, AI_API_BASE_URL, AI_API_KEY, AI_MODEL.
  Defaults to AI_PROVIDER=mock (demo mode — no API key needed).

HOW TO START DEMO
  The app auto-loads a "Downtown Intersection Demo" project with completed
  analysis. Click "Demo Mode" in the sidebar or "Open Demo" on the Overview.

DOCUMENTATION PATH
  source/docs/   — GETTING_STARTED, ARCHITECTURE, AI_PROVIDERS, DEPLOYMENT,
                   TROUBLESHOOTING, CUSTOMIZATION, LICENSING, SECURITY,
                   THIRD_PARTY_LICENSES
  source/README.md — top-level orientation
  source/marketing/PRODUCT_LISTING.md — pricing & license tiers

SUPPORT / CONTACT
  Configure brand.supportEmail in source/src/lib/brand.ts
EOF

echo "→ Creating ZIP…"
(cd "$OUT_DIR" && zip -qr "$NAME-v$VERSION.zip" "$NAME-v$VERSION")

echo "✓ Release package: $OUT_DIR/$NAME-v$VERSION.zip"
du -sh "$OUT_DIR/$NAME-v$VERSION.zip"
