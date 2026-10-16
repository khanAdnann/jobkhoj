let adUnitQueue = Promise.resolve()

export function mountAdUnit(container, options, scriptUrl, label) {
  let cancelled = false
  let script = null
  let cancelCurrentLoad = null

  const load = () =>
    new Promise((resolve) => {
      if (cancelled || !container.isConnected) {
        resolve()
        return
      }

      const previousOptions = window.atOptions
      const currentOptions = options
      let finished = false

      const finish = () => {
        if (finished) return
        finished = true
        if (window.atOptions === currentOptions) {
          if (previousOptions === undefined) {
            delete window.atOptions
          } else {
            window.atOptions = previousOptions
          }
        }
        cancelCurrentLoad = null
        resolve()
      }

      window.atOptions = currentOptions
      script = document.createElement('script')
      script.src = scriptUrl
      script.async = true
      script.onload = finish
      script.onerror = () => {
        console.error(`[ads] Could not load ${label}.`)
        finish()
      }
      cancelCurrentLoad = finish
      container.appendChild(script)
    })

  adUnitQueue = adUnitQueue.then(load, load)

  return () => {
    cancelled = true
    cancelCurrentLoad?.()
    script?.remove()
    container.replaceChildren()
  }
}
