#!/usr/bin/env bash
#
# deploy-remote.sh - Deploy storm-hub backend from local Mac to Lighthouse server
#
# This script runs on your LOCAL machine (Mac) and:
# 1. Syncs local code to the server via rsync
# 2. Triggers docker compose rebuild on the server via SSH
# 3. Checks health endpoint
#
# Usage:
#   cd server/scripts
#   ./deploy-remote.sh
#
# Prerequisites:
#   - SSH access to server configured (see below)
#   - rsync installed (macOS default)
#   - Server has Docker & Docker Compose installed
#   - Server has .env configured at /opt/storm-hub/server/.env
#
# SSH Setup:
#   Add to ~/.ssh/config:
#     Host storm-hub
#       HostName 124.223.113.122
#       User ubuntu
#       IdentityFile ~/.ssh/your-key
#
#   Or use direct SSH: ubuntu@124.223.113.122

set -euo pipefail

# ============================================================================
# Configuration - EDIT THESE VALUES
# ============================================================================

# SSH target: either an alias from ~/.ssh/config or user@host
SSH_TARGET="ubuntu@124.223.113.122"

# Remote deployment directory on the server
REMOTE_DIR="/opt/storm-hub"

# Domain for health check (optional, comment out to skip)
HEALTH_URL="https://api.fao13578.cn/api/health"

# ============================================================================
# Script Start
# ============================================================================

echo "🚀 Deploying storm-hub backend to ${SSH_TARGET}"

# Get the repository root (two levels up from scripts/)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "📁 Local repo: ${REPO_ROOT}"

# Sync repository to server (excluding large/generated/secret files)
echo ""
echo "📤 Syncing files to server..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='*.db' \
  --exclude='*.db-*' \
  --exclude='*.sqlite*' \
  --exclude='dist' \
  --exclude='unpackage' \
  --exclude='.DS_Store' \
  --exclude='.vscode' \
  --exclude='.idea' \
  "${REPO_ROOT}/" \
  "${SSH_TARGET}:${REMOTE_DIR}/"

echo "✅ Files synced"

# Run docker compose on the server
echo ""
echo "🐳 Building and starting Docker container on server..."
ssh "${SSH_TARGET}" "cd ${REMOTE_DIR}/server && docker compose up -d --build"

echo "✅ Docker container rebuilt"

# Wait a moment for container to start
echo ""
echo "⏳ Waiting for service to start..."
sleep 5

# Health check (optional)
if [ -n "${HEALTH_URL:-}" ]; then
  echo ""
  echo "🏥 Checking health endpoint..."
  if curl -sf "${HEALTH_URL}" > /dev/null; then
    echo "✅ Health check passed: ${HEALTH_URL}"
  else
    echo "⚠️  Health check failed: ${HEALTH_URL}"
    echo "    Check logs: ssh ${SSH_TARGET} 'cd ${REMOTE_DIR}/server && docker compose logs -f'"
    exit 1
  fi
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    ssh ${SSH_TARGET} 'cd ${REMOTE_DIR}/server && docker compose logs -f'"
echo "   Restart:      ssh ${SSH_TARGET} 'cd ${REMOTE_DIR}/server && docker compose restart'"
echo "   Stop:         ssh ${SSH_TARGET} 'cd ${REMOTE_DIR}/server && docker compose down'"
echo "   Shell access: ssh ${SSH_TARGET} 'cd ${REMOTE_DIR}/server && docker compose exec storm-hub-api sh'"
