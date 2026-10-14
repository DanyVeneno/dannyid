# Tarjeta de presentación · React + Tailwind + Plasma UI

## Puesta en marcha
```bash
cp -r /ruta/a/tu/media/* public/media/     # welcome3.wav (y b.mp4 si lo usas)
npm install                                # genera package-lock.json → CÓMMITEALO
npm run dev                                # desarrollo
npm run build                              # typecheck + build en dist/
```
Desde la segunda vez (y en CI/Docker) usa `npm ci`: instala exactamente lo del lockfile.

## Despliegue
**Node.js (recomendado) — servidor propio sin dependencias en `server/server.mjs`:**
```bash
npm run build && npm start            # http://localhost:8080
```
Variables: `PORT`, `HOST`, `DIST_DIR`, `RATE_LIMIT` (req/min por IP, 300), `TRUST_PROXY=1` si va detrás de nginx/Caddy/Cloudflare (toma el último valor de X-Forwarded-For).
Healthcheck en `/healthz`. Detrás de un proxy con HTTPS, deja que él termine TLS.

**Docker (Node, usuario sin privilegios, sin node_modules en la imagen final):**
```bash
docker build -t tarjeta .
docker run -d --read-only --cap-drop=ALL --security-opt no-new-privileges -p 8080:8080 tarjeta
```
Alternativa con nginx: `docker build -f Dockerfile.nginx -t tarjeta-nginx .`

**VPS sin Docker:** `npm ci && npm run build`, y un servicio systemd que ejecute `node server/server.mjs` con `User=` sin privilegios, `NoNewPrivileges=true` y `ProtectSystem=strict`.

**Netlify / Cloudflare Pages:** publica `dist/`; `public/_headers` aplica las mismas cabeceras.

## Hostinger VPS (Ubuntu) paso a paso
Arquitectura: **Caddy** (HTTPS automático) → **Node** (`127.0.0.1:8080`, servicio systemd endurecido).

1. **DNS:** en hPanel → Dominios → DNS, crea un registro **A** (p. ej. `tarjeta`) hacia la IP de tu VPS.
2. **Firewall de hPanel:** si lo tienes activo, permite 22, 80 y 443.
3. **Conéctate** (`ssh root@IP`) y sube la carpeta `deploy/hostinger/` (o clona el repo). Ejecuta una sola vez:
   ```bash
   chmod +x setup.sh && ./setup.sh tarjeta.tudominio.com
   ```
   Instala Node 22 y Caddy, crea el usuario `tarjeta`, el servicio, el firewall (ufw) y fail2ban.
4. **Publica desde tu computadora** (con tu carpeta `public/media/` ya copiada):
   ```bash
   ./deploy/hostinger/deploy.sh root@IP_DEL_VPS
   ```
   Compila localmente y sube solo `dist/` y `server/`. Repite este comando para cada actualización.
5. Abre `https://tarjeta.tudominio.com`. Logs: `journalctl -u tarjeta -f`.

Recomendado después: entra con **llave SSH** y desactiva la contraseña de root (`PasswordAuthentication no`; confirma antes que tu llave funciona en otra terminal).
Si el VPS ya usa los puertos 80/443 (otra web, panel, n8n…), `setup.sh` se detiene y te lo indica.

## Qué lo hace más seguro
- **Sin CDN ni scripts de terceros:** íconos (react-icons) y Plasma UI van dentro del bundle; antes dependía de Font Awesome en cdnjs.
- **CSP estricta** (`script-src 'self'`, `style-src 'self'`, `default-src 'none'`), más `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP y HSTS.
- **Sin rastreadores de analítica:** la tarjeta no carga scripts de seguimiento de terceros.
- **Enlaces externos** siempre `https` (`safeUrl`) y con `rel="noopener noreferrer"`.
- **Dependencias fijadas** a versión exacta + lockfile + `npm audit`. La librería Plasma UI está **vendorizada** en `src/lib/plasma-ui` (MIT, sin depender del registro npm).
- **Servidor Node sin dependencias** (solo módulos nativos): bloquea path traversal y dotfiles, solo GET/HEAD, límite de peticiones por IP, timeouts anti-Slowloris, no registra query strings, Range/ETag/gzip/brotli, cierre limpio con SIGTERM.
- **Contenedor:** multi-stage, usuario `node` sin privilegios, imagen final sin node_modules, sin sourcemaps.

## Notas
- Plasma UI es pesada en GPU y su autor recomienda escritorio; en táctil se baja `quality` y se activa `freezeOnScroll`. Sin WebGL2 usa el respaldo CSS.
- `welcome3.wav` pesa ~19 MB: conviene comprimirlo, p. ej. `ffmpeg -i welcome3.wav -b:a 96k welcome3.mp3` y cambiar la ruta en `src/data.ts`.
- Cambio único a la librería: se quitó el `<style>` que inyectaba en runtime (la CSP lo bloquearía); sus reglas están en `src/index.css`.
# dannyid
