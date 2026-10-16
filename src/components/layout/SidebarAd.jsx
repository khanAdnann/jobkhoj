import { useEffect, useRef } from 'react'

const AD_OPTIONS = {
  key: '0cd6bbd7a2786708eddeadfe6fd5c29a',
  format: 'iframe',
  height: 600,
  width: 160,
  params: {},
}

const AD_SCRIPT_URL = 'https://bicea.org/22/0cd6bbd7a2786708eddeadfe6fd5c29a'

export default function SidebarAd() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const previousOptions = window.atOptions
    window.atOptions = AD_OPTIONS

    const script = document.createElement('script')
    script.src = AD_SCRIPT_URL
    script.async = true
    script.onerror = () => {
      console.error('[ads] The sidebar ad script could not be loaded.')
    }
    container.appendChild(script)

    return () => {
      script.remove()
      if (window.atOptions === AD_OPTIONS) {
        if (previousOptions === undefined) {
          delete window.atOptions
        } else {
          window.atOptions = previousOptions
        }
      }
      container.replaceChildren()
    }
  }, [])

  return (
    <aside
      aria-label="Advertisement"
      className="sticky top-24 hidden h-[600px] w-[160px] self-start min-[1200px]:block"
    >
      <div ref={containerRef} className="h-[600px] w-[160px]" />
    </aside>
  )
}
