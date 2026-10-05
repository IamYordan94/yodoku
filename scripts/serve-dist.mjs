#!/usr/bin/env node
/**
 * Tiny static server for verifying the prerendered dist/ output locally.
 * Mirrors Vercel's behaviour:
 *   1. exact file            -> served as-is
 *   2. <path>/index.html     -> served (directory index)
 *   3. anything else         -> dist/index.html (SPA fallback)
 *
 * Usage: node scripts/serve-dist.mjs [port] [distDir]
 */
import { createServer } from 'node:http';
import { statSync, readFileSync } from 'node:fs';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || 4173);
const DIST = resolve(process.argv[3] || join(__dirname, '..', 'dist'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function send(res, status, body, type) {
  res.writeHead(status, { 'content-type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  // Strip the leading slash and any ".." traversal, then resolve inside DIST.
  const parts = urlPath.split('/').filter((s) => s && s !== '.' && s !== '..');
  const candidate = join(DIST, ...parts);
  const inDist = candidate === DIST || candidate.startsWith(DIST + sep);
  const tryFile = (p) => {
    try {
      return statSync(p).isFile() ? p : null;
    } catch {
      return null;
    }
  };
  const file = (inDist && (tryFile(candidate) || tryFile(join(candidate, 'index.html')))) || join(DIST, 'index.html');
  const body = readFileSync(file);
  send(res, 200, body, TYPES[extname(file).toLowerCase()]);
}).listen(PORT, () => console.log(`serve-dist: http://localhost:${PORT} (${DIST})`));
