/**
 * Tiny class-name joiner. Supports strings, arrays and `{ 'class': cond }`
 * objects so components can build conditional Tailwind class lists without
 * pulling in clsx/tailwind-merge.
 */
export function cn(...args) {
  const out = []

  for (const arg of args) {
    if (!arg) continue

    if (typeof arg === 'string' || typeof arg === 'number') {
      out.push(String(arg))
    } else if (Array.isArray(arg)) {
      const nested = cn(...arg)
      if (nested) out.push(nested)
    } else if (typeof arg === 'object') {
      for (const key in arg) {
        if (arg[key]) out.push(key)
      }
    }
  }

  return out.join(' ')
}

export default cn
