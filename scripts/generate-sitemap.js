import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteOrigin = 'https://jobkhoj-theta.vercel.app'
const staticPaths = [
  '/',
  '/jobs',
  '/companies',
  '/about',
  '/contact',
  '/help',
  '/privacy-policy',
  '/terms',
]
const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...staticPaths.flatMap((pathname) => [
    '  <url>',
    `    <loc>${escapeXml(`${siteOrigin}${pathname}`)}</loc>`,
    '  </url>',
  ]),
  '</urlset>',
  '',
].join('\n')

await mkdir(path.join(rootDir, 'public'), { recursive: true })
await writeFile(path.join(rootDir, 'public', 'sitemap.xml'), sitemap, 'utf8')
console.log(`Generated sitemap with ${staticPaths.length} verified public routes.`)
