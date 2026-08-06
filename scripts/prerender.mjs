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

const { render, jsonLdScript } = await import(
  pathToFileURL(join(serverDir, 'entry-server.js')).href
);

const template = await readFile(join(distDir, 'index.html'), 'utf8');

/**
 * Two substitutions, both of which must land. A silent miss here ships a page
 * with no content or no structured data and nothing would notice until a
 * crawler did, so each one throws rather than warns.
 */
const substitutions = [
  ['<div id="root"></div>', () => `<div id="root">${render()}</div>`],
  ['<!--seo-jsonld-->', () => jsonLdScript],
];

let html = template;

for (const [placeholder, build] of substitutions) {
  if (!html.includes(placeholder)) {
    throw new Error(`prerender: could not find ${placeholder} in dist/index.html`);
  }
  html = html.replace(placeholder, build);
}

await writeFile(join(distDir, 'index.html'), html, 'utf8');

await rm(serverDir, { recursive: true, force: true });

console.log('prerender: dist/index.html now contains the full page');
