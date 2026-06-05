import { RefObject, useEffect, useState } from 'react'

interface UseInViewportOptions {
  // the selector for the scrollable ancestor used as the IntersectionObserver
  // root. Defaults to the reporter's command log scroll container.
  rootSelector?: string
  // how far outside the viewport (in any direction) content should be
  // considered "in view" so that it is rendered just before it scrolls in.
  rootMargin?: string
}

interface UseInViewportResult {
  isInViewport: boolean
  // the last measured height of the observed content, captured right before it
  // leaves the viewport so a placeholder can preserve the scroll position when
  // the heavy content is unmounted.
  placeholderHeight?: number
}

/**
 * Observes `targetRef` against the reporter's scroll container and reports
 * whether it is within (or near) the viewport.
 *
 * This is used to "window out" the command log of finished tests that have
 * scrolled out of view. Failed tests are kept open and their command logs are
 * retained for the run-mode video/screenshots (see attempt-model `finish`), but
 * keeping hundreds of command nodes mounted for every prior failure makes the
 * per-command auto-scroll force a full-document reflow, slowing down every
 * subsequent test (https://github.com/cypress-io/cypress/issues/6881). By only
 * mounting the heavy content while it is on screen, the live DOM stays bounded
 * to what is visible while the data itself is preserved.
 */
export const useInViewport = (
  targetRef: RefObject<Element>,
  contentRef: RefObject<HTMLElement>,
  { rootSelector = '.container', rootMargin = '300px' }: UseInViewportOptions = {},
): UseInViewportResult => {
  const [isInViewport, setIsInViewport] = useState(true)
  const [placeholderHeight, setPlaceholderHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const target = targetRef.current

    // if IntersectionObserver isn't available (e.g. older test environments),
    // fall back to always rendering so we never hide content unexpectedly.
    if (!target || typeof IntersectionObserver === 'undefined') {
      return
    }

    const root = target.closest(rootSelector)

    const observer = new IntersectionObserver(([entry]) => {
      // capture the rendered height before the content is unmounted so the
      // placeholder can hold the same space and avoid scroll jumps
      if (!entry.isIntersecting && contentRef.current) {
        setPlaceholderHeight(contentRef.current.offsetHeight)
      }

      setIsInViewport(entry.isIntersecting)
    }, { root, rootMargin })

    observer.observe(target)

    return () => observer.disconnect()
  }, [targetRef, contentRef, rootSelector, rootMargin])

  return { isInViewport, placeholderHeight }
}
