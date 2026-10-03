import { createServer } from 'node:http';
import { copyFile, lstat, mkdir, readFile, readdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';

const publicFiles = ['index.html', 'styles.css', 'app.js', '.nojekyll'];
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function inside(root, target) {
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Refusing a path outside the site directory.');
  }
  return target;
}

async function rejectLink(filename) {
  const stat = await lstat(filename);
  if (stat.isSymbolicLink()) throw new Error(`Refusing a symbolic link: ${filename}`);
  return stat;
}

export function normalizePrefix(value = '/') {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]*\/?$/.test(value)) {
    throw new Error('The prefix must be a path such as /mypage/.');
  }
  return value.endsWith('/') ? value : `${value}/`;
}

export function createSiteServer({ root, prefix = '/' }) {
  prefix = normalizePrefix(prefix);
  const rootPath = path.resolve(root);
  return createServer(async (req, res) => {
    function reply(status, message, headers = {}) {
      res.writeHead(status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
        ...headers,
      });
      res.end(req.method === 'HEAD' ? undefined : message);
    }

    if (!['GET', 'HEAD'].includes(req.method)) {
      reply(405, 'Method not allowed.', { Allow: 'GET, HEAD' });
      return;
    }

    let pathname;
    try {
      const raw = req.url.split('?')[0];
      if (/%2f|%5c/i.test(raw)) throw new Error('Encoded separator');
      pathname = decodeURIComponent(raw);
      if (!pathname.startsWith('/') || /[\\:\x00-\x1f\x7f]/.test(pathname)) throw new Error('Invalid path');
      if (pathname.split('/').some((part) => part === '.' || part === '..')) throw new Error('Traversal');
    } catch {
      reply(400, 'Invalid request path.');
      return;
    }

    if (prefix !== '/' && pathname === prefix.slice(0, -1)) {
      reply(308, 'Continue to the site.', { Location: prefix });
      return;
    }
    if (!pathname.startsWith(prefix)) {
      reply(404, 'Page not found.');
      return;
    }

    const relative = pathname.slice(prefix.length) || 'index.html';
    const parts = relative.split('/');
    const allowed = publicFiles.includes(relative)
      || (parts[0] === 'assets' && parts.length > 1 && parts.every((part) => part && !part.startsWith('.')));
    if (!allowed) {
      reply(404, 'Page not found.');
      return;
    }

    try {
      const canonicalRoot = await realpath(rootPath);
      let filename = canonicalRoot;
      let stat;
      for (const part of parts) {
        filename = inside(canonicalRoot, path.join(filename, part));
        stat = await rejectLink(filename);
      }
      if (!stat.isFile()) {
        reply(404, 'Page not found.');
        return;
      }
      inside(canonicalRoot, await realpath(filename));
      const body = await readFile(filename);
      res.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filename).toLowerCase()] || 'application/octet-stream',
        'Content-Length': body.length,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code) || /symbolic link|outside/.test(error.message)) {
        reply(404, 'Page not found.');
      } else {
        console.error('Unable to read the requested site file:', error.message);
        reply(500, 'Unable to load this file.');
      }
    }
  });
}

async function collectFiles(root, directory, { skipHidden = false } = {}) {
  const stat = await rejectLink(directory);
  if (!stat.isDirectory()) throw new Error(`Expected a directory: ${directory}`);
  const files = [];
  for (const name of await readdir(directory)) {
    if (skipHidden && name.startsWith('.')) continue;
    const filename = inside(root, path.join(directory, name));
    const entry = await rejectLink(filename);
    if (entry.isDirectory()) files.push(...await collectFiles(root, filename, { skipHidden }));
    else if (entry.isFile()) files.push(filename);
    else throw new Error(`Unsupported site file: ${filename}`);
  }
  return files;
}

export async function buildSite(root) {
  const canonicalRoot = await realpath(path.resolve(root));
  const files = [];
  for (const name of publicFiles) {
    const filename = inside(canonicalRoot, path.join(canonicalRoot, name));
    if (!(await rejectLink(filename)).isFile()) throw new Error(`Expected a file: ${filename}`);
    files.push(filename);
  }
  files.push(...await collectFiles(canonicalRoot, path.join(canonicalRoot, 'assets'), { skipHidden: true }));

  // Check the exact resolved output and its contents before any recursive removal.
  const output = inside(canonicalRoot, path.resolve(canonicalRoot, 'dist'));
  if (path.dirname(output) !== canonicalRoot || path.basename(output) !== 'dist') {
    throw new Error('Refusing to clean an unexpected build directory.');
  }
  try {
    await collectFiles(canonicalRoot, output);
    if (await realpath(output) !== output) throw new Error('Refusing a redirected build directory.');
    await rm(output, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await mkdir(path.join(output, 'assets'), { recursive: true });
  for (const filename of files) {
    const destination = inside(output, path.join(output, path.relative(canonicalRoot, filename)));
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(filename, destination);
  }
  return output;
}
