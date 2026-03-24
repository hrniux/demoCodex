import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
]);

function getContentType(filePath) {
  return MIME_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

async function resolveFilePath(rootDir, requestUrl) {
  const parsed = new URL(requestUrl, 'http://127.0.0.1');
  const decodedPath = decodeURIComponent(parsed.pathname);
  const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
  const candidatePath = path.resolve(rootDir, `.${relativePath}`);
  const normalizedRoot = `${path.resolve(rootDir)}${path.sep}`;

  if (candidatePath !== path.resolve(rootDir) && !candidatePath.startsWith(normalizedRoot)) {
    throw new Error('Path escapes static server root');
  }

  const stats = await fs.stat(candidatePath);
  if (stats.isDirectory()) {
    return path.join(candidatePath, 'index.html');
  }

  return candidatePath;
}

export async function startStaticServer({ rootDir, host = '127.0.0.1', port = 0 }) {
  const resolvedRoot = path.resolve(rootDir);

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad request');
      return;
    }

    try {
      const filePath = await resolveFilePath(resolvedRoot, req.url);
      const body = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(body);
    } catch (error) {
      const statusCode =
        error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT' ? 404 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(statusCode === 404 ? 'Not found' : 'Server error');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve static server address');
  }

  return {
    host,
    port: address.port,
    rootDir: resolvedRoot,
    server,
    url: `http://${host}:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}
