/**
 * Bakes the page into dist/index.html so the content is readable before any
 * JavaScript runs.
 *
 * This is not a framework and it does not need to become one. The site is one
 * static page: render it once, paste the markup in, delete the server build.
 * Everything after that is the same client-side app hydrating over it.
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const serverDir = join(distDir, 'server');

const { render } = await import(pathToFileURL(join(serverDir, 'entry-server.js')).href);

const template = await readFile(join(distDir, 'index.html'), 'utf8');
const placeholder = '<div id="root"></div>';

if (!template.includes(placeholder)) {
  throw new Error('prerender: could not find the root element in dist/index.html');
}

await writeFile(
  join(distDir, 'index.html'),
  template.replace(placeholder, `<div id="root">${render()}</div>`),
  'utf8',
);

await rm(serverDir, { recursive: true, force: true });

console.log('prerender: dist/index.html now contains the full page');
