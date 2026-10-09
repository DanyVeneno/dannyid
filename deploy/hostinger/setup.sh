#!/usr/bin/env bash
# Prepara un VPS Ubuntu/Debian (Hostinger) UNA sola vez.  Uso (como root):  ./setup.sh tarjeta.tudominio.com
set -euo pipefail

DOMAIN="${1:-}"
[[ -n "$DOMAIN" ]] || { echo "Uso: $0 tu.dominio.com"; exit 1; }
[[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || { echo "Dominio no válido: $DOMAIN"; exit 1; }
[[ $EUID -eq 0 ]] || { echo "Ejecútalo como root"; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"

# Los puertos 80/443 deben estar libres (otro servidor web los ocuparía)
if ss -tlnH 'sport = :80 or sport = :443' | grep -q . && ! systemctl is-active --quiet caddy; then
  echo "⚠ Ya hay algo escuchando en el puerto 80 o 443:"; ss -tlnp 'sport = :80 or sport = :443'
  echo "Detén ese servicio (o dime cuál es) antes de continuar."; exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw fail2ban debian-keyring debian-archive-keyring apt-transport-https unattended-upgrades

# Node.js 22 (repositorio oficial NodeSource)
if ! command -v node >/dev/null || [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# Caddy (repositorio oficial)
if ! command -v caddy >/dev/null; then
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

# Usuario sin login y carpeta de la app
id tarjeta &>/dev/null || useradd --system --home /opt/tarjeta --shell /usr/sbin/nologin tarjeta
mkdir -p /opt/tarjeta/dist /opt/tarjeta/server
chown -R tarjeta:tarjeta /opt/tarjeta

# Servicio y proxy
install -m 644 "$HERE/tarjeta.service" /etc/systemd/system/tarjeta.service
sed "s/__DOMAIN__/$DOMAIN/g" "$HERE/Caddyfile" > /etc/caddy/Caddyfile
systemctl daemon-reload
systemctl enable --now tarjeta caddy
systemctl reload caddy || systemctl restart caddy

# Firewall: solo SSH, 80 y 443
ufw default deny incoming; ufw default allow outgoing
ufw allow OpenSSH; ufw allow 80/tcp; ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban

echo; echo "✔ Servidor listo para $DOMAIN. Ahora sube la tarjeta con deploy/hostinger/deploy.sh desde tu computadora."
