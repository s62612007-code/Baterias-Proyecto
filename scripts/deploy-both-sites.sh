#!/usr/bin/env bash
# Despliegue a bateriascali.es + hondabateriacali.com (versión negro/amarillo)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${BATERIASCALI_FTP_PASS:?Defina BATERIASCALI_FTP_PASS en .env}"
: "${HONDA_FTP_PASS:?Defina HONDA_FTP_PASS o DEPLOY_PASS en .env}"

export BATERIASCALI_FTP_PASS
export HONDA_FTP_PASS="${HONDA_FTP_PASS:-${DEPLOY_PASS:-}}"

echo "▶ Build estático…"
npm run build

python3 "${ROOT}/scripts/deploy-both-ftp.py"

echo ""
echo "▶ Verificando bateriascali.es…"
VERIFY_URL=https://bateriascali.es bash "${ROOT}/scripts/verify-deploy.sh"

echo ""
echo "▶ Verificando hondabateriacali.com…"
curl -sI --max-time 15 "https://hondabateriacali.com/" | head -1
curl -sL --max-time 15 "https://hondabateriacali.com/" | grep -oE 'Barracuda Taller Honda|offers-ticker|barracuda-float__road' | sort | uniq -c
