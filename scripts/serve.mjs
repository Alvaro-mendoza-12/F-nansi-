import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4'
};

export async function serve({ port = 0, prefix = '/' } = {}) {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith(prefix)) throw new Error('ruta fuera del sitio');
      const relative = pathname.slice(prefix.length) || 'index.html';
      if (relative !== 'index.html' && !relative.startsWith('docs/')) throw new Error('ruta fuera de la demo');
      const file = resolve(root, relative);
      if (!file.startsWith(root + sep)) throw new Error('ruta inválida');
      const data = await readFile(file);
      response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream' });
      response.end(data);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Archivo no encontrado.');
    }
  });

  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolveListen);
  });
  return {
    url: 'http://127.0.0.1:' + server.address().port + prefix,
    close: () => new Promise((resolveClose) => {
      server.close(resolveClose);
      server.closeAllConnections();
    })
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const site = await serve({ port: Number(process.env.PORT ?? 4173) });
  console.log('Finansi disponible en ' + site.url);
}
