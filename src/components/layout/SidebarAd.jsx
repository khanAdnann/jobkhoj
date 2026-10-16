import { useEffect, useRef } from 'react'
import { mountAdUnit } from '@/utils/adUnits'

const OPTIONS = {
  key: '0cd6bbd7a2786708eddeadfe6fd5c29a',
  format: 'iframe',
  height: 600,
  width: 160,
  params: {},
}

export default function SidebarAd() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    return mountAdUnit(
      container,
      OPTIONS,
      'https://bicea.org/22/0cd6bbd7a2786708eddeadfe6fd5c29a',
      '160×600 sidebar ad',
    )
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
