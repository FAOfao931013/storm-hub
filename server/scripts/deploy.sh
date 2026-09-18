#!/usr/bin/env bash
#
# deploy.sh - Server-side deployment helper
#
# This script runs ON THE SERVER after files are already synced.
# It simply rebuilds and restarts the Docker container.
#
# Usage (on server):
#   cd /opt/storm-hub/server
#   ./scripts/deploy.sh
#
# Note: For deployment from local machine, use scripts/deploy-remote.sh instead.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "🐳 Rebuilding and starting storm-hub-api container..."
docker compose up -d --build

echo "✅ Container rebuilt"
echo ""
echo "📋 Check status:"
echo "   docker compose ps"
echo "   docker compose logs -f"
echo ""
echo "🏥 Test health:"
echo "   curl http://127.0.0.1:3000/api/health"
