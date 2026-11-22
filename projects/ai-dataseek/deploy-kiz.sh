#!/usr/bin/env bash
# Deploy AI-DataSeek to kiz.fairspace.cn (172.16.7.81)
# Run on the target server, inside the project directory.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# --- 1. Preflight checks ------------------------------------------------
echo "==> Preflight checks"
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: docker compose not available"; exit 1; }
[ -f .env ] || { echo "ERROR: .env not found — copy .env.example first and fill values"; exit 1; }

# API_KEY sanity check (user must replace placeholder)
if grep -q 'API_KEY=.*replace\|API_KEY=.*需要配置\|API_KEY=.*"' .env; then
    echo "WARNING: .env still has API_KEY placeholder — deployment will succeed but LLM calls will fail."
    read -rp "Continue anyway? [y/N] " ans
    [[ "$ans" =~ ^[Yy] ]] || exit 1
fi

echo "Server:  $(hostname) ($(hostname -I 2>/dev/null | awk '{print $1}'))"
echo "Time:    $(date '+%F %T %Z')"
echo "Compose: $(docker compose version)"
echo

# --- 2. Build images ----------------------------------------------------
echo "==> Building images (frontend + backend + sandbox + jupyter)"
docker compose build --parallel
echo

# --- 3. Start stack -----------------------------------------------------
echo "==> Starting containers"
docker compose up -d --remove-orphans
echo

# --- 4. Verify ----------------------------------------------------------
echo "==> Container status"
docker compose ps
echo

echo "==> Quick sanity check"
sleep 5
if curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:${FRONTEND_PORT:-7000}/ | grep -qE '200|301|302|404'; then
    echo "  frontend on :${FRONTEND_PORT:-7000}: OK"
else
    echo "  frontend: not responding yet — check logs: docker compose logs frontend"
fi
echo

echo "==> Done"
echo "Frontend exposed on host port ${FRONTEND_PORT:-7000}"
echo "Visit: http://172.16.7.81:${FRONTEND_PORT:-7000}"
echo
echo "(Optional) Host Nginx install for port-80 access (http://172.16.7.81):"
echo "  sudo apt install -y nginx"
echo "  sudo cp nginx-kiz.conf /etc/nginx/sites-available/"
echo "  sudo ln -sf /etc/nginx/sites-available/nginx-kiz.conf /etc/nginx/sites-enabled/"
echo "  sudo rm -f /etc/nginx/sites-enabled/default"
echo "  sudo nginx -t && sudo systemctl reload nginx"
