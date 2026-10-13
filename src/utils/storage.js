/**
 * Namespaced, JSON-safe localStorage wrapper.
 * Every mock/live key the app reads or writes is namespaced under "jobkhoj:"
 * so the app never collides with anything else on the origin.
 */
const NAMESPACE = 'jobkhoj'

const fullKey = (key) => `${NAMESPACE}:${key}`

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(fullKey(key))
      if (raw === null) return fallback
      return JSON.parse(raw)
    } catch {
      // Private mode, quota exceeded, or corrupt JSON — degrade to fallback.
      return fallback
    }
  },

  has(key) {
    try {
      return window.localStorage.getItem(fullKey(key)) !== null
    } catch {
      return false
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(fullKey(key), JSON.stringify(value))
      return true
    } catch {
      // Quota exceeded / storage disabled — app keeps working in memory.
      return false
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(fullKey(key))
      return true
    } catch {
      return false
    }
  },

  /** Remove every key this app owns, leaving other origin data untouched. */
  clearAll() {
    try {
      const keys = []
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i)
        if (key && key.startsWith(`${NAMESPACE}:`)) keys.push(key)
      }
      keys.forEach((key) => window.localStorage.removeItem(key))
      return true
    } catch {
      return false
    }
  },
}

export default storage
