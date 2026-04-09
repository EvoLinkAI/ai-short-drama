#!/bin/bash
# ==================================================
# One-click deploy to Mac Mini (local WiFi network)
#
# Usage:
#   ./scripts/deploy-to-mini.sh
#
# Before first use:
#   1. Install Docker on the Mac Mini
#   2. Set up passwordless SSH: ssh-copy-id user@macmini.local
#   3. Update MINI_HOST and MINI_USER below
#   4. Copy docker-compose.yml to the Mac Mini
# ==================================================

set -e

# ========== Config ==========
MINI_USER="evolink-02"                  # Mac Mini username
MINI_HOST="192.168.1.77"                # Mac Mini host address
MINI_DIR="~/aidrama-studio"             # Working directory on Mac Mini
IMAGE_NAME="aidrama-studio:local"
TAR_FILE="/tmp/aidrama-studio-image.tar.gz"
# ============================

echo "========================================"
echo "  Deploying aidrama-studio to Mac Mini"
echo "========================================"

# 1. Build image locally
echo ""
echo "[1/5] Building Docker image..."
docker build -t "$IMAGE_NAME" . 2>&1 | tail -3

# 2. Export image to tar
echo ""
echo "[2/5] Exporting image → $TAR_FILE"
docker save "$IMAGE_NAME" | gzip > "$TAR_FILE"
SIZE=$(du -h "$TAR_FILE" | cut -f1)
echo "       Image size: $SIZE"

# 3. Transfer image to Mac Mini
echo ""
echo "[3/5] Transferring to $MINI_USER@$MINI_HOST..."
scp "$TAR_FILE" "$MINI_USER@$MINI_HOST:/tmp/aidrama-studio-image.tar.gz"

# 4. Sync config files to Mac Mini
echo ""
echo "[4/5] Syncing config files..."
scp docker-compose.yml "$MINI_USER@$MINI_HOST:$MINI_DIR/docker-compose.yml"
scp .env.example "$MINI_USER@$MINI_HOST:$MINI_DIR/.env.example"

# 5. Load image and restart services remotely
echo ""
echo "[5/5] Deploying remotely..."
ssh "$MINI_USER@$MINI_HOST" bash -s << 'REMOTE_EOF'
  set -e
  export PATH="$HOME/bin:/usr/local/bin:$PATH"
  echo "  Loading image..."
  docker load < /tmp/aidrama-studio-image.tar.gz
  rm -f /tmp/aidrama-studio-image.tar.gz

  cd ~/aidrama-studio
  echo "  Restarting services..."
  docker compose up -d --force-recreate
  echo "  Waiting for startup..."
  sleep 10

  # Check if startup succeeded
  if docker logs --tail 3 aidrama-studio-app 2>&1 | grep -q "ready"; then
    echo ""
    echo "  ✅ Deployment successful!"
  else
    echo ""
    echo "  ⚠️  Still starting — check logs: docker logs -f aidrama-studio-app"
  fi
REMOTE_EOF

# Clean up local temp file
rm -f "$TAR_FILE"

echo ""
echo "========================================"
echo "  Deployment complete"
echo "  URL: http://$MINI_HOST:23000"
echo "========================================"
