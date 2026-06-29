#!/usr/bin/env bash
# Despliegue forzado a hondabateriacali.com vía SFTP (Piensa / IONOS)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Cargar credenciales locales (no commitear .env)
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DEPLOY_HOST:?Defina DEPLOY_HOST en .env (ej: hondabateriacali.com o access-xxx.webspace-host.com)}"
: "${DEPLOY_USER:?Defina DEPLOY_USER en .env}"
: "${DEPLOY_PATH:=/}"
: "${DEPLOY_PORT:=22}"

echo "▶ Build estático…"
npm run build

KEY="${DEPLOY_KEY:-$HOME/.ssh/bateriagelylitio_ionos}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -p "$DEPLOY_PORT")
[[ -f "$KEY" ]] && SSH_OPTS+=(-i "$KEY")

echo "▶ Subiendo dist/ → ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
rsync -avz --delete -e "ssh ${SSH_OPTS[*]}" \
  "${ROOT}/dist/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

echo "✓ Despliegue completado: https://hondabateriacali.com/#marca-duncan"
