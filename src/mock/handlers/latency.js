/**
 * Simulated network latency so skeleton loaders are actually visible during
 * development. Values are deliberately modest to keep the app feeling snappy.
 */
export function delay(min = 220, max = 520) {
  const ms = Math.round(min + Math.random() * (max - min))
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/** Fails with a network-style error — used to exercise error states. */
export function fail(message = 'Something went wrong') {
  const error = new Error(message)
  error.isMockError = true
  throw error
}

export default delay
