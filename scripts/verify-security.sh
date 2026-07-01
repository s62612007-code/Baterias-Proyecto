#!/usr/bin/env bash
# Verificación de cabeceras de seguridad HTTPS
set -euo pipefail
BASE="${VERIFY_URL:-https://bateriascali.es}"
BASE="${BASE%/}"

echo "▶ Seguridad ${BASE}"

fail=0
headers=$(curl -sI --max-time 15 "$BASE/" || true)

check_header() {
  local name="$1"
  local label="$2"
  if echo "$headers" | grep -qi "^${name}:"; then
    echo "  ✓ ${label}"
  else
    echo "  ✗ Falta ${label}"
    fail=1
  fi
}

check_header "strict-transport-security" "HSTS"
check_header "x-frame-options" "X-Frame-Options"
check_header "x-content-type-options" "X-Content-Type-Options"
check_header "referrer-policy" "Referrer-Policy"
check_header "content-security-policy" "Content-Security-Policy"

# Redirección HTTP → HTTPS
http_code=$(curl -sI --max-time 12 "http://${BASE#https://}" 2>/dev/null | head -1 | awk '{print $2}' || echo "?")
if [[ "$http_code" == "301" || "$http_code" == "302" || "$http_code" == "308" ]]; then
  echo "  ✓ Redirección HTTP→HTTPS ($http_code)"
else
  echo "  · Redirección HTTP→HTTPS (${http_code:-no disponible})"
fi

# Contenido visible actualizado
body=$(curl -sL --max-time 15 "$BASE/" || true)
echo "$body" | grep -q "offer-card" && echo "  ✓ Ofertas visibles" || { echo "  ✗ Ofertas no visibles"; fail=1; }
echo "$body" | grep -q "barracuda-float__car" && echo "  ✓ Barracuda visible" || { echo "  ✗ Barracuda no visible"; fail=1; }
echo "$body" | grep -q "10% menos" && echo "  ✓ Descuento 10% visible" || { echo "  ✗ Descuento no visible"; fail=1; }

exit $fail
