import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.7z': 'application/x-7z-compressed' };

export function createStaticServer(rootDirectory, { mount = '' } = {}) {
  const root = path.resolve(rootDirectory);
  const normalizedMount = mount && mount !== '/' ? `/${mount.replace(/^\/+|\/+$/g, '')}` : '';
  return http.createServer((request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (normalizedMount) {
        if (pathname === normalizedMount) { response.writeHead(308, { Location: `${normalizedMount}/` }); response.end(); return; }
        if (!pathname.startsWith(`${normalizedMount}/`)) { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found'); return; }
        pathname = pathname.slice(normalizedMount.length);
      }
      const relative = pathname.replace(/^\/+/, '') || 'index.html';
      let target = path.resolve(root, relative);
      if (!target.startsWith(root + path.sep) && target !== root) throw new Error('Unsafe path');
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      if (!fs.existsSync(target)) {
        const fallback = path.join(root, '404.html');
        if (fs.existsSync(fallback)) { response.writeHead(404, { 'Content-Type': MIME['.html'] }); response.end(fs.readFileSync(fallback)); return; }
        throw new Error('Not found');
      }
      response.writeHead(200, { 'Content-Type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream' });
      response.end(fs.readFileSync(target));
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] ?? 'out';
  const port = Number(process.argv[3] ?? 4173);
  const mount = process.argv[4] ?? '';
  const server = createStaticServer(root, { mount });
  server.listen(port, '127.0.0.1', () => console.log(`Serving ${path.resolve(root)}${mount ? ` at ${mount}` : ''} on http://127.0.0.1:${port}${mount}/`));
}
