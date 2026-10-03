import { fileURLToPath } from 'node:url';
import { buildSite } from './site.mjs';

try {
  const output = await buildSite(fileURLToPath(new URL('../', import.meta.url)));
  console.log(`Static site built in ${output}`);
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
}
