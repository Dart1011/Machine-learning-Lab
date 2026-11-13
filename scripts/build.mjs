import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../dist/', import.meta.url);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  cp(new URL('../index.html', import.meta.url), new URL('index.html', output)),
  cp(new URL('../styles.css', import.meta.url), new URL('styles.css', output)),
  cp(new URL('../code-lab.css', import.meta.url), new URL('code-lab.css', output)),
  cp(new URL('../src/', import.meta.url), new URL('src/', output), { recursive: true }),
]);

console.log('Built GCI Skills Lab into dist/');
