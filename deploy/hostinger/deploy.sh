#!/usr/bin/env bash
# Compila en TU computadora y sube solo dist/ + server/ al VPS.  Uso:  ./deploy/hostinger/deploy.sh root@IP_DEL_VPS
# (el VPS no necesita npm ni node_modules: solo Node)
set -euo pipefail

TARGET="${1:-}"
[[ -n "$TARGET" ]] || { echo "Uso: $0 usuario@IP"; exit 1; }
cd "$(dirname "$0")/../.."

[[ -f public/media/welcome3.wav || -f public/media/welcome3.mp3 ]] || echo "⚠ Falta public/media/ (el saludo no sonará)"
npm ci
npm run build

rsync -az --delete dist/ "$TARGET:/opt/tarjeta/dist/"
rsync -az --delete server/ "$TARGET:/opt/tarjeta/server/"
ssh "$TARGET" "chown -R tarjeta:tarjeta /opt/tarjeta && systemctl restart tarjeta && sleep 1 && systemctl is-active tarjeta"
echo "✔ Publicado."
