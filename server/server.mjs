// Servidor estático sin dependencias (solo Node >= 20) para la tarjeta.
// Variables: PORT=8080  HOST=0.0.0.0  DIST_DIR=../dist  TRUST_PROXY=1 (detrás de proxy)
//            ENABLE_METRICOOL=1 (relaja la CSP para el rastreador)  RATE_LIMIT=300 (req/min/IP)
import http from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.DIST_DIR ?? path.join(here, "..", "dist"));
const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? "0.0.0.0";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const METRICOOL = process.env.ENABLE_METRICOOL === "1";
const RATE_LIMIT = Number(process.env.RATE_LIMIT ?? 300);

// ---------- Cabeceras de seguridad (una sola fuente de verdad) ----------
const tracker = METRICOOL ? " https://tracker.metricool.com" : "";
const SECURITY = {
  "Content-Security-Policy": [
    "default-src 'none'", `script-src 'self'${tracker}`, "style-src 'self'", "img-src 'self' data:",
    "media-src 'self'", "font-src 'self'", `connect-src 'self'${tracker}`, "manifest-src 'self'",
    "base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'", "object-src 'none'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webp": "image/webp",
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".mp4": "video/mp4", ".xml": "application/xml",
};
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".webmanifest", ".svg", ".xml"]);

// ---------- Límite de peticiones por IP (ventana de 1 minuto) ----------
const hits = new Map();
setInterval(() => hits.clear(), 60_000).unref();
const limited = (ip) => { const n = (hits.get(ip) ?? 0) + 1; hits.set(ip, n); return n > RATE_LIMIT; };
// Con TRUST_PROXY se toma el ÚLTIMO valor de X-Forwarded-For (el que añadió nuestro proxy);
// el primero lo puede falsificar el cliente para esquivar el límite de peticiones.
const clientIp = (req) =>
  (TRUST_PROXY && req.headers["x-forwarded-for"]?.split(",").at(-1).trim()) || req.socket.remoteAddress || "?";

const zcache = new Map(); // archivos comprimidos en memoria (pocos y pequeños)

function send(res, status, body = "", extra = {}) {
  res.writeHead(status, { ...SECURITY, "Content-Type": "text/plain; charset=utf-8", ...extra });
  res.end(body);
}

/** Resuelve una URL a un archivo dentro de ROOT; null si es sospechosa. */
function resolveFile(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return null; }
  if (p.includes("\0") || p.includes("\\")) return null;
  if (p.split("/").some((seg) => seg.startsWith("."))) return null;       // dotfiles y ".."
  const full = path.normalize(path.join(ROOT, p));
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;    // path traversal
  return full;
}

async function handle(req, res) {
  if (limited(clientIp(req))) return send(res, 429, "Too Many Requests", { "Retry-After": "60" });
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });

  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (pathname === "/healthz") return send(res, 200, "ok", { "Cache-Control": "no-store" });

  let file = resolveFile(pathname);
  if (!file) return send(res, 404, "Not Found");
  let st = await stat(file).catch(() => null);
  if (st?.isDirectory()) { file = path.join(file, "index.html"); st = await stat(file).catch(() => null); }
  if (!st?.isFile()) return send(res, 404, "Not Found");

  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const cache = pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable"
    : ext === ".html" ? "no-cache" : "public, max-age=86400";
  const base = { ...SECURITY, "Content-Type": type, "Cache-Control": cache, ETag: etag, "Accept-Ranges": "bytes", Vary: "Accept-Encoding" };

  if (req.headers["if-none-match"] === etag) { res.writeHead(304, base); return res.end(); }

  // Compresión para texto (br > gzip)
  const ae = String(req.headers["accept-encoding"] ?? "");
  const enc = COMPRESSIBLE.has(ext) && st.size < 1_000_000 ? (/\bbr\b/.test(ae) ? "br" : /\bgzip\b/.test(ae) ? "gzip" : null) : null;
  if (enc) {
    const key = `${file}|${etag}|${enc}`;
    let buf = zcache.get(key);
    if (!buf) {
      const raw = await readFile(file);
      buf = enc === "br" ? zlib.brotliCompressSync(raw) : zlib.gzipSync(raw);
      zcache.set(key, buf);
    }
    res.writeHead(200, { ...base, "Content-Encoding": enc, "Content-Length": buf.length });
    return res.end(req.method === "HEAD" ? undefined : buf);
  }

  // Range (necesario para que Safari reproduzca audio/video)
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    let start = m && m[1] !== "" ? Number(m[1]) : NaN;
    let end = m && m[2] !== "" ? Number(m[2]) : NaN;
    if (m && Number.isNaN(start) && !Number.isNaN(end)) { start = Math.max(st.size - end, 0); end = st.size - 1; } // bytes=-N
    if (!m || Number.isNaN(start)) return send(res, 416, "Range Not Satisfiable", { "Content-Range": `bytes */${st.size}` });
    if (Number.isNaN(end) || end >= st.size) end = st.size - 1;
    if (start > end || start >= st.size) return send(res, 416, "Range Not Satisfiable", { "Content-Range": `bytes */${st.size}` });
    res.writeHead(206, { ...base, "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1 });
    return req.method === "HEAD" ? res.end() : createReadStream(file, { start, end }).pipe(res);
  }

  res.writeHead(200, { ...base, "Content-Length": st.size });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).on("error", () => res.destroy()).pipe(res);
}

const server = http.createServer((req, res) => {
  handle(req, res)
    .catch(() => { if (!res.headersSent) send(res, 500, "Internal Server Error"); else res.destroy(); })
    .finally(() => console.log(`${req.method} ${(req.url ?? "").split("?")[0]} ${res.statusCode}`)); // sin query string
});
// Endurecimiento contra conexiones lentas / abusivas (Slowloris)
server.headersTimeout = 10_000;
server.requestTimeout = 10_000;
server.keepAliveTimeout = 5_000;
server.maxHeadersCount = 50;
server.maxRequestsPerSocket = 200;

server.listen(PORT, HOST, () => console.log(`Tarjeta en http://${HOST}:${PORT}  (dist: ${ROOT})`));

const stop = () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 5_000).unref(); };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
