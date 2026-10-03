import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSiteServer, normalizePrefix } from './site.mjs';

try {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--dist' && !arg.startsWith('--prefix='))) {
    throw new Error('Usage: npm run dev -- --prefix=/mypage/');
  }
  const prefix = normalizePrefix(args.find((arg) => arg.startsWith('--prefix='))?.slice(9) || '/');
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  const workspace = fileURLToPath(new URL('../', import.meta.url));
  const root = args.includes('--dist') ? path.join(workspace, 'dist') : workspace;
  await access(path.join(root, 'index.html')).catch(() => {
    throw new Error(args.includes('--dist') ? 'Build the site first with npm run build.' : 'index.html is missing.');
  });
  const server = createSiteServer({ root, prefix });
  server.on('error', (error) => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Set PORT to another local port.` : error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Local ${args.includes('--dist') ? 'build preview' : 'site'}: http://127.0.0.1:${port}${prefix}`);
    console.log('Press Ctrl+C to stop.');
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
