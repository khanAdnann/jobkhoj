import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jobs as jobsSeed } from '../src/mock/seed/jobs.js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteOrigin = 'https://jobkhoj-theta.vercel.app'
const excludedJobIds = new Set([
  'job-1012',
  'job-1015',
  'job-1017',
  'job-1018',
  'job-1020',
  'job-1024',
])

const staticPaths = [
  '/',
  '/jobs',
  '/jobs/java-developer-jobs',
  '/jobs/software-developer-jobs',
  '/jobs/fresher-jobs',
  '/jobs/remote-jobs',
  '/jobs/spring-boot-jobs',
  '/jobs/backend-developer-jobs',
  '/jobs/internship-jobs',
  '/jobs/banking-jobs',
  '/companies',
  '/about',
  '/contact',
  '/help',
  '/privacy-policy',
  '/terms',
]

const companyNames = new Map(
  [...(await readFile(path.join(rootDir, 'src', 'mock', 'seed', 'companies.js'), 'utf8')).matchAll(/id:\s*'([^']+)'[\s\S]*?name:\s*'((?:\\.|[^'])*)'/g)].map(([, id, name]) => [id, name]),
)

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function slugifyJobText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getJobDetailsPath(job) {
  const companyName = companyNames.get(job.companyId) ?? job.companyName ?? 'company'
  const descriptivePart = slugifyJobText([job.title, companyName, job.location].filter(Boolean).join(' '))
  return `/jobs/${descriptivePart}--${encodeURIComponent(job.id)}`
}

const publicJobs = jobsSeed.filter((job) => !excludedJobIds.has(job.id))
const routePaths = [
  ...staticPaths,
  ...publicJobs.map((job) => getJobDetailsPath(job)),
]

const uniquePaths = [...new Set(routePaths.map((pathname) => pathname.replace(/\/+$/, '') || '/'))]
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...uniquePaths.flatMap((pathname) => [
    '  <url>',
    `    <loc>${escapeXml(`${siteOrigin}${pathname}`)}</loc>`,
    '  </url>',
  ]),
  '</urlset>',
  '',
].join('\n')

await mkdir(path.join(rootDir, 'public'), { recursive: true })
await writeFile(path.join(rootDir, 'public', 'sitemap.xml'), sitemap, 'utf8')
console.log(`Generated sitemap with ${uniquePaths.length} verified public routes.`)
