export type SnapshotStyle = string | { href: string, media?: string } | { css: string, media: string }

export const createSnapshotStyle = (doc: Document, style: SnapshotStyle) => {
  const element = doc.createElement(typeof style !== 'string' && 'href' in style ? 'link' : 'style')

  if (typeof style !== 'string' && 'href' in style) {
    element.setAttribute('rel', 'stylesheet')
    element.setAttribute('href', style.href)
  } else {
    element.textContent = typeof style === 'string' ? style : style.css
  }

  if (typeof style !== 'string' && style.media !== undefined) {
    element.setAttribute('media', style.media)
  }

  return element
}
