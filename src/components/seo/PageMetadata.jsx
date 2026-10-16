import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_ORIGIN = 'https://jobkhoj-theta.vercel.app'
const DEFAULT_TITLE = 'JobKhoj — Find Your Dream Job. Build Your Future.'

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  const created = !element

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }

  const previousContent = element.getAttribute('content')
  element.setAttribute('content', content)

  return () => {
    if (created) element.remove()
    else if (previousContent === null) element.removeAttribute('content')
    else element.setAttribute('content', previousContent)
  }
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]')
  const created = !element

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.append(element)
  }

  const previousHref = element.getAttribute('href')
  element.setAttribute('href', href)

  return () => {
    if (created) element.remove()
    else if (previousHref === null) element.removeAttribute('href')
    else element.setAttribute('href', previousHref)
  }
}

export default function PageMetadata({ title, description }) {
  const { pathname } = useLocation()

  useEffect(() => {
    const previousTitle = document.title
    const canonicalPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
    const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`
    const cleanups = [
      setMeta('name', 'description', description),
      setMeta('property', 'og:title', title),
      setMeta('property', 'og:description', description),
      setMeta('property', 'og:url', canonicalUrl),
      setMeta('name', 'twitter:title', title),
      setMeta('name', 'twitter:description', description),
      setCanonical(canonicalUrl),
    ]

    document.title = title

    return () => {
      document.title = previousTitle || DEFAULT_TITLE
      cleanups.reverse().forEach((cleanup) => cleanup())
    }
  }, [description, pathname, title])

  return null
}
