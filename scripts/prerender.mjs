/**
 * Bakes every published page into its own file in dist/ so the content is
 * readable before any JavaScript runs.
 *
 * This is not a framework and it does not need to become one. The site is a
 * handful of static pages: render each one, paste the markup into the same
 * template, delete the server build. Everything after that is the same
 * client-side app hydrating over whichever page was served.
 *
 * The page list comes from src/content/routes.ts and is not restated here.
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const serverDir = join(distDir, 'server');

const { render, jsonLdFor, siteUrl, prerenderRoutes, emptyCopySlots } = await import(
  pathToFileURL(join(serverDir, 'entry-server.js')).href
);

const template = await readFile(join(distDir, 'index.html'), 'utf8');

/**
 * Nothing goes live half-written.
 *
 * A route stops being a draft the moment someone clears its `draft` flag, and
 * the flag is only as safe as this check: without it, clearing it one commit
 * ahead of the copy would publish a page with no heading and no body and the
 * build would report success. Every published route is checked before a single
 * file is written, so the build either produces the whole site or none of it.
 */
for (const route of prerenderRoutes) {
  const empty = emptyCopySlots(route.key);

  if (empty.length > 0) {
    throw new Error(
      `prerender: ${route.path} is published but its copy is empty — ` +
        `fa.pages.${route.key} is missing ${empty.join(', ')}. ` +
        `Write the Persian in src/content/fa.ts, or set draft: true for '${route.key}' ` +
        `in src/content/routes.ts until it exists.`,
    );
  }
}

/**
 * Two substitutions per page, both of which must land. A silent miss here ships
 * a page with no content or no structured data and nothing would notice until a
 * crawler did, so each one throws rather than warns — for every page, not only
 * for home.
 */
const buildPage = (route) => {
  const substitutions = [
    ['<div id="root"></div>', () => `<div id="root">${render(route.path)}</div>`],
    ['<!--seo-jsonld-->', () => jsonLdFor(route)],
  ];

  let html = template;

  for (const [placeholder, build] of substitutions) {
    if (!html.includes(placeholder)) {
      throw new Error(`prerender: could not find ${placeholder} in the template for ${route.path}`);
    }
    html = html.replace(placeholder, build);
  }

  return route.meta === null ? html : withPageHead(html, route);
};

/**
 * Rewrites the head tags that are page-specific.
 *
 * index.html is home's head, written by hand and correct for home. Every other
 * page starts from the same template, so seven tags in it would otherwise be a
 * lie: they would tell a crawler that /automation is the home page, at home's
 * URL, with home's title. A canonical pointing somewhere else is the single
 * most effective way to make a page disappear from an index.
 *
 * Each rewrite is an explicit, named replacement that throws when its target is
 * missing, for the same reason the two substitutions above do: an edit to
 * index.html that renames a tag must break the build, not quietly ship a page
 * that describes the wrong URL. This is not a general HTML rewriter and must
 * not become one — if the head grows a tag that varies per page, add it here by
 * name.
 */
const withPageHead = (html, route) => {
  const { title, description, canonical } = route.meta;
  const escape = (value) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  const rewrites = [
    [/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`],
    [
      /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
      `$1${escape(description)}$2`,
    ],
    [/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`],
    [/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`],
    [/(<meta property="og:title" content=")[\s\S]*?(")/, `$1${escape(title)}$2`],
    [
      /(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/,
      `$1${escape(description)}$2`,
    ],
    [
      /(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/,
      `$1${escape(description)}$2`,
    ],
    [/(<link rel="alternate" hreflang="fa-IR" href=")[^"]*(")/, `$1${canonical}$2`],
    [/(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/, `$1${canonical}$2`],
  ];

  let out = html;

  for (const [pattern, replacement] of rewrites) {
    if (!pattern.test(out)) {
      throw new Error(
        `prerender: ${route.path} — no match for ${pattern} in index.html. ` +
          `The head tag it targets was renamed or removed; update the rewrite in ` +
          `scripts/prerender.mjs so this page does not ship home's metadata.`,
      );
    }
    out = out.replace(pattern, replacement);
  }

  return out;
};

/**
 * `/` is index.html; `/automation` is automation.html, which `cleanUrls` in
 * vercel.json serves back at `/automation`.
 */
const fileFor = (route) => (route.path === '/' ? 'index.html' : `${route.path.slice(1)}.html`);

for (const route of prerenderRoutes) {
  await writeFile(join(distDir, fileFor(route)), buildPage(route), 'utf8');
}

/**
 * The sitemap, generated rather than committed.
 *
 * It used to live in public/ with a `<lastmod>` typed by hand, which is a date
 * that is correct exactly once. A date that never moves tells a crawler the
 * site never moves, and a wrong date is worse than none — Google weighs
 * `lastmod` only for sites whose `lastmod` has proved trustworthy.
 *
 * The build date is a proxy for the content date, and the trade-off is real:
 * redeploying for a CSS tweak bumps it too. For a three-person team shipping a
 * small site that is close enough to always mean "we changed something", and
 * the alternative — hashing the copy against a committed stamp file — is more
 * machinery than the accuracy is worth. Revisit that if deploys ever get
 * frequent and content changes do not.
 *
 * `changefreq` and `priority` are gone. Google has stated it ignores both, and
 * a field nobody reads is a field that will eventually be wrong.
 */
const lastmod = new Date().toISOString().slice(0, 10);

/* The same string the page declares as its canonical, not a second derivation
   of it. Home's meta is null because index.html authors its own head, so its
   URL is built here — the one place that has to stay in step with the canonical
   written in that file. Everything else reuses what the page itself claims, so
   a sitemap entry and a canonical cannot disagree. */
const locFor = (route) => (route.meta === null ? `${siteUrl}/` : route.meta.canonical);

const urls = prerenderRoutes
  .map(
    (route) => `  <url>
    <loc>${locFor(route)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/prerender.mjs. Do not edit; edit the script. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf8');

await rm(serverDir, { recursive: true, force: true });

const built = prerenderRoutes.map(fileFor).join(', ');
console.log(`prerender: wrote ${built} — full pages. sitemap.xml stamped ${lastmod}`);
