import { storage } from '@/utils/storage'

/**
 * Career Tools usage, history and saved results.
 *
 * Frontend-only for now: everything lives in namespaced localStorage so the
 * UX (remaining free runs, past reports) is complete without a backend. Each
 * function has a documented Spring Boot counterpart — see `BACKEND_CONTRACT`
 * — so moving to a real subscription/credit system is a service swap only.
 */

export const FREE_LIMITS = {
  atsCheck: 5,
  pdfConversion: 10,
  coverLetter: 5,
  interviewSet: 5,
  aiAnalysis: 5,
}

export const BACKEND_CONTRACT = {
  history: 'GET /api/tools/history · POST /api/tools/history · DELETE /api/tools/history',
  usage: 'GET /api/tools/usage · POST /api/tools/usage/consume',
  saved: 'GET /api/tools/results · POST /api/tools/results · DELETE /api/tools/results/:id',
}

const HISTORY_KEY = 'tools.history'
const USAGE_KEY = 'tools.usage'
const SAVED_KEY = 'tools.saved'
const MAX_HISTORY = 50

const now = () => new Date().toISOString()
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/* -------------------------------- history -------------------------------- */

/** @returns {Array<{id:string,toolId:string,tool:string,fileName:string,date:string,status:string,summary:string}>} */
export function listHistory() {
  return storage.get(HISTORY_KEY, [])
}

export function recordHistory({
  toolId,
  tool,
  fileName = '',
  summary = '',
  status = 'Completed',
  href = null,
}) {
  const entry = {
    id: makeId('hist'),
    toolId,
    tool,
    fileName,
    summary,
    status,
    href,
    date: now(),
  }
  const next = [entry, ...listHistory()].slice(0, MAX_HISTORY)
  storage.set(HISTORY_KEY, next)
  return entry
}

export function clearHistory() {
  storage.set(HISTORY_KEY, [])
  return true
}

export function removeHistoryEntry(id) {
  storage.set(HISTORY_KEY, listHistory().filter((entry) => entry.id !== id))
  return true
}

/* --------------------------------- usage --------------------------------- */

export function getUsage() {
  return storage.get(USAGE_KEY, {})
}

export function usageFor(bucket) {
  const used = getUsage()[bucket] ?? 0
  const limit = FREE_LIMITS[bucket] ?? 0
  return { bucket, used, limit, remaining: Math.max(0, limit - used) }
}

export function hasUsage(bucket) {
  return usageFor(bucket).remaining > 0
}

/**
 * Throws when the free allowance is already gone — call BEFORE doing work so
 * an exhausted user never gets a half-finished result.
 * @throws with `code: 'LIMIT_EXCEEDED'` and the current usage attached
 */
export function checkUsage(bucket) {
  const before = usageFor(bucket)
  if (before.limit && before.remaining <= 0) {
    const error = new Error(
      `You have used all ${before.limit} free runs for this tool. Subscribe for unlimited use.`,
    )
    error.code = 'LIMIT_EXCEEDED'
    error.usage = before
    throw error
  }
  return before
}

/**
 * Increments a counter.
 * @returns {{used:number,limit:number,remaining:number}}
 * @throws when the free allowance is exhausted (UI shows the upgrade card)
 */
export function consumeUsage(bucket) {
  checkUsage(bucket)
  const usage = getUsage()
  usage[bucket] = (usage[bucket] ?? 0) + 1
  storage.set(USAGE_KEY, usage)
  return usageFor(bucket)
}

export function resetUsage() {
  storage.set(USAGE_KEY, {})
  return true
}

/* ------------------------------ saved results ----------------------------- */

export function listSaved() {
  return storage.get(SAVED_KEY, [])
}

export function saveResult({ toolId, title, content, meta = {} }) {
  const entry = {
    id: makeId('saved'),
    toolId,
    title,
    content,
    meta,
    date: now(),
  }
  storage.set(SAVED_KEY, [entry, ...listSaved()].slice(0, 50))
  return entry
}

export function deleteSaved(id) {
  storage.set(SAVED_KEY, listSaved().filter((entry) => entry.id !== id))
  return true
}

export default {
  listHistory,
  recordHistory,
  clearHistory,
  getUsage,
  usageFor,
  hasUsage,
  checkUsage,
  consumeUsage,
  resetUsage,
  listSaved,
  saveResult,
  deleteSaved,
}
