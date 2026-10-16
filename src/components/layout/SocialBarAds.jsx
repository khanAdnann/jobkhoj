import { useEffect, useRef } from 'react'

const SOCIAL_BAR_SCRIPTS = [
  'https://afders.org/1/11ca7aa4c28b0ae9ceb620001b844f36',
  'https://bicea.org/14/5008531df82050cd42daeb847fb72705',
]

export default function SocialBarAds() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const scripts = SOCIAL_BAR_SCRIPTS.map((src) => {
      const script = document.createElement('script')
      script.setAttribute('data-cfasync', 'false')
      script.src = src
      script.async = false
      script.onerror = () => {
        console.error(`[ads] Could not load social bar script: ${src}`)
      }
      container.appendChild(script)
      return script
    })

    return () => {
      scripts.forEach((script) => script.remove())
      container.replaceChildren()
    }
  }, [])

  return <div ref={containerRef} aria-label="Social bar advertisement" />
}
