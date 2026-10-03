import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const tooling = await import('./site.mjs').catch((error) => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});

async function fixture(t) {
  const base = await realpath(tmpdir());
  const root = await mkdtemp(path.join(base, 'homepage-tooling-'));
  t.after(async () => {
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved), base);
    assert.ok(path.basename(resolved).startsWith('homepage-tooling-'));
    await rm(resolved, { recursive: true, force: true });
  });
  await mkdir(path.join(root, 'assets'));
  await Promise.all([
    writeFile(path.join(root, 'index.html'), '<h1>Example</h1>'),
    writeFile(path.join(root, 'styles.css'), 'body { color: black; }'),
    writeFile(path.join(root, 'app.js'), 'console.log("Example");'),
    writeFile(path.join(root, '.nojekyll'), ''),
    writeFile(path.join(root, 'assets', 'sample.svg'), '<svg/>'),
    writeFile(path.join(root, 'README.md'), 'Private documentation'),
    writeFile(path.join(root, 'package.json'), '{}'),
  ]);
  return root;
}

async function server(t, root, prefix = '/') {
  assert.equal(typeof tooling.createSiteServer, 'function', 'The site server is implemented');
  const instance = tooling.createSiteServer({ root, prefix });
  await new Promise((resolve) => instance.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => instance.close(resolve)));
  return instance.address().port;
}

function get(port, pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path: pathname, method }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString(),
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('serves page, assets, MIME types, query strings, and HEAD requests', async (t) => {
  const root = await fixture(t);
  const port = await server(t, root);
  const page = await get(port, '/?preview=1');
  assert.equal(page.status, 200);
  assert.match(page.headers['content-type'], /^text\/html/);
  assert.equal(page.body, '<h1>Example</h1>');
  assert.match((await get(port, '/styles.css')).headers['content-type'], /^text\/css/);
  assert.match((await get(port, '/app.js')).headers['content-type'], /javascript/);
  assert.match((await get(port, '/assets/sample.svg')).headers['content-type'], /^image\/svg\+xml/);
  const head = await get(port, '/index.html', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
});

test('keeps project internals private and only accepts read requests', async (t) => {
  const port = await server(t, await fixture(t));
  for (const pathname of ['/README.md', '/package.json', '/scripts/site.mjs', '/.git/config', '/assets/.env']) {
    assert.equal((await get(port, pathname)).status, 404, pathname);
  }
  assert.equal((await get(port, '/', 'POST')).status, 405);
});

test('rejects traversal, encoded separators, malformed URLs, and Windows alternate streams', async (t) => {
  const port = await server(t, await fixture(t));
  for (const pathname of ['/../index.html', '/assets/%2e%2e/index.html', '/assets/%2f..%2findex.html', '/%zz', '/assets%5c..%5cindex.html', '/index.html:secret']) {
    assert.equal((await get(port, pathname)).status, 400, pathname);
  }
});

test('supports a GitHub Pages project prefix without masking missing paths', async (t) => {
  const port = await server(t, await fixture(t), '/mypage/');
  assert.equal((await get(port, '/mypage/')).status, 200);
  assert.equal((await get(port, '/mypage/assets/sample.svg')).status, 200);
  const redirect = await get(port, '/mypage');
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.location, '/mypage/');
  assert.equal((await get(port, '/')).status, 404);
  assert.equal((await get(port, '/mypage/missing')).status, 404);
});

test('build copies only public content and removes old build output', async (t) => {
  assert.equal(typeof tooling.buildSite, 'function', 'The site builder is implemented');
  const root = await fixture(t);
  await mkdir(path.join(root, 'dist'));
  await writeFile(path.join(root, 'dist', 'stale.txt'), 'old');
  await tooling.buildSite(root);
  assert.deepEqual((await readdir(path.join(root, 'dist'))).sort(), ['.nojekyll', 'app.js', 'assets', 'index.html', 'styles.css']);
  assert.equal(await readFile(path.join(root, 'dist', 'assets', 'sample.svg'), 'utf8'), '<svg/>');
  assert.equal(await readFile(path.join(root, 'README.md'), 'utf8'), 'Private documentation');
});

test('refuses asset links outside the source and leaves their files untouched', async (t) => {
  assert.equal(typeof tooling.buildSite, 'function', 'The site builder is implemented');
  const root = await fixture(t);
  const outside = await fixture(t);
  await symlink(outside, path.join(root, 'assets', 'linked'), 'junction');
  const port = await server(t, root);
  assert.equal((await get(port, '/assets/linked/index.html')).status, 404);
  await assert.rejects(tooling.buildSite(root), /symbolic link/i);
  assert.equal(await readFile(path.join(outside, 'index.html'), 'utf8'), '<h1>Example</h1>');
});

test('refuses a redirected dist directory before cleaning anything', async (t) => {
  assert.equal(typeof tooling.buildSite, 'function', 'The site builder is implemented');
  const root = await fixture(t);
  const outside = await fixture(t);
  await symlink(outside, path.join(root, 'dist'), 'junction');
  await assert.rejects(tooling.buildSite(root), /symbolic link/i);
  assert.equal(await readFile(path.join(outside, 'index.html'), 'utf8'), '<h1>Example</h1>');
});
