import { storage } from '@/utils/storage'
import { buildSeed, resetSeedCache } from './seed'

/**
 * In-browser mock database backed by localStorage.
 *
 * Why this exists: the Spring Boot backend is not connected yet, but the whole
 * UI must be fully interactive — applying, saving jobs, shortlisting,
 * publishing and moderating all need to *persist*. Static constants would make
 * every write disappear on reload and the app would feel like a demo.
 *
 * Services use these handlers in `VITE_API_MODE=mock`; jobs and mock auth
 * therefore persist in the current browser instead of Supabase.
 */

const TABLES = [
  'users',
  'companies',
  'jobs',
  'applications',
  'savedJobs',
  'jobAlerts',
  'notifications',
]

/** Tables that hold exactly one record. */
const SINGLETONS = ['analytics']
const NITI_JOB_SEED_MIGRATION = 'migration.niti-pune-job-2026'
const NITI_JOB_ID = 'job-niti-pune-developers-2026'
const NITI_COMPANY_ID = 'cmp-niti-technologies-india-software'

let idCounter = Date.now()

export function generateId(prefix = 'id') {
  idCounter += 1
  return `${prefix}-${idCounter.toString(36)}`
}

/* ------------------------------ table access ------------------------------ */

function ensureSeeded(tableName) {
  if (!TABLES.includes(tableName)) {
    throw new Error(`[mock] Unknown table "${tableName}"`)
  }
  if (!storage.has(tableName)) {
    const seed = buildSeed()[tableName]
    storage.set(tableName, seed ?? [])
  }

  if (tableName === 'jobs' || tableName === 'companies') {
    migrateNitiJobSeed()
  }
}

function migrateNitiJobSeed() {
  if (storage.has(NITI_JOB_SEED_MIGRATION)) return

  const seed = buildSeed()
  const company = seed.companies.find((row) => row.id === NITI_COMPANY_ID)
  const job = seed.jobs.find((row) => row.id === NITI_JOB_ID)

  for (const [tableName, record] of [
    ['companies', company],
    ['jobs', job],
  ]) {
    const rows = storage.has(tableName) ? storage.get(tableName, []) : seed[tableName] ?? []
    if (record && !rows.some((row) => row.id === record.id)) {
      storage.set(tableName, [...rows, record])
    } else if (!storage.has(tableName)) {
      storage.set(tableName, rows)
    }
  }

  storage.set(NITI_JOB_SEED_MIGRATION, true)
}

function ensureSingleton(name) {
  if (!SINGLETONS.includes(name)) {
    throw new Error(`[mock] Unknown singleton "${name}"`)
  }
  if (storage.has(name)) return

  storage.set(name, buildSeed()[name])
}

export const db = {
  /* -------------------------------- read -------------------------------- */

  all(tableName) {
    ensureSeeded(tableName)
    return storage.get(tableName, [])
  },

  find(tableName, id) {
    return db.all(tableName).find((row) => row.id === id) ?? null
  },

  where(tableName, predicate) {
    return db.all(tableName).filter(predicate)
  },

  first(tableName, predicate) {
    return db.all(tableName).find(predicate) ?? null
  },

  count(tableName, predicate) {
    return predicate ? db.where(tableName, predicate).length : db.all(tableName).length
  },

  singleton(name) {
    ensureSingleton(name)
    return storage.get(name, null)
  },

  /* ------------------------------- write -------------------------------- */

  insert(tableName, row) {
    const rows = db.all(tableName)
    const record = { id: row.id ?? generateId(tableName), ...row }
    // Never let an undefined id override the generated one.
    if (row.id === undefined) record.id = generateId(tableName)

    storage.set(tableName, [...rows, record])
    return record
  },

  insertMany(tableName, newRows) {
    const rows = db.all(tableName)
    storage.set(tableName, [
      ...rows,
      ...newRows.map((row) => ({ id: row.id ?? generateId(tableName), ...row })),
    ])
    return newRows
  },

  update(tableName, id, patch) {
    const rows = db.all(tableName)
    let updated = null

    const next = rows.map((row) => {
      if (row.id !== id) return row
      updated = { ...row, ...patch, id: row.id }
      return updated
    })

    if (!updated) return null

    storage.set(tableName, next)
    return updated
  },

  updateWhere(tableName, predicate, patch) {
    const rows = db.all(tableName)
    let count = 0

    const next = rows.map((row) => {
      if (!predicate(row)) return row
      count += 1
      return { ...row, ...patch }
    })

    storage.set(tableName, next)
    return count
  },

  remove(tableName, id) {
    const rows = db.all(tableName)
    const next = rows.filter((row) => row.id !== id)
    storage.set(tableName, next)
    return next.length !== rows.length
  },

  removeWhere(tableName, predicate) {
    const rows = db.all(tableName)
    const next = rows.filter((row) => !predicate(row))
    storage.set(tableName, next)
    return rows.length - next.length
  },

  replaceAll(tableName, rows) {
    storage.set(tableName, rows)
    return rows
  },

  /* ------------------------------ lifecycle ------------------------------ */

  /** Wipes every mock table and re-seeds from src/mock/seed. */
  reset() {
    resetSeedCache()
    TABLES.forEach((tableName) => storage.remove(tableName))
    SINGLETONS.forEach((name) => storage.remove(name))
    storage.remove(NITI_JOB_SEED_MIGRATION)
    return db.stats()
  },

  stats() {
    return {
      companies: storage.has('companies') ? db.count('companies') : buildSeed().companies.length,
      jobs: storage.has('jobs') ? db.count('jobs') : buildSeed().jobs.length,
      users: storage.has('users') ? db.count('users') : buildSeed().users.length,
      applications: storage.has('applications')
        ? db.count('applications')
        : buildSeed().applications.length,
    }
  },
}

export default db
