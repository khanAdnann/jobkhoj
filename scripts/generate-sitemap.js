import { createServer } from 'vite'
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

const vite = await createServer({
  configFile: path.join(rootDir, 'vite.config.js'),
  root: rootDir,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

try {
  const [{ buildSeed }, { JOB_STATUS }] = await Promise.all([
    vite.ssrLoadModule('/src/mock/seed/index.js'),
    vite.ssrLoadModule('/src/utils/constants.js'),
  ])
  const activeJobPaths = buildSeed().jobs
    .filter((job) => job.status === JOB_STATUS.ACTIVE && new Date(job.deadline) > new Date())
    .map((job) => `/jobs/${encodeURIComponent(job.id)}`)
  const urls = [...new Set([...staticPaths, ...activeJobPaths])]
  const escapeXml = (value) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((pathname) => `  <url><loc>${escapeXml(`${siteOrigin}${pathname}`)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')

  await mkdir(path.join(rootDir, 'public'), { recursive: true })
  await writeFile(path.join(rootDir, 'public', 'sitemap.xml'), sitemap, 'utf8')
  console.log(`Generated sitemap with ${urls.length} URLs (${activeJobPaths.length} active jobs).`)
} finally {
  await vite.close()
}
