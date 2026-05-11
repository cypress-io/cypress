import $elements from '../elements'
import { memoize } from './memoize'
import { unwrap, wrap, isJquery } from '../jquery'
import { scrollBehaviorOptionsMap } from '../../util/scrollBehavior'
import { getShadowElementFromPoint } from '../elements/shadow'
import { findParent, getParentNode } from '../elements/find'
import Debug from 'debug'

const debug = Debug('cypress:driver:dom:visibility:fastIsHidden')

const { isOption, isOptgroup, isBody, isHTML } = $elements

const getBoundingClientRect = memoize((el: HTMLElement) => el.getBoundingClientRect())

const visibleAtPoint = memoize(function (el: HTMLElement, x: number, y: number): boolean {
  const lightElAtPoint = el.ownerDocument.elementFromPoint(x, y)

  if (!lightElAtPoint) return false

  // Pierce nested shadow roots so the comparison reflects what the user actually sees.
  const elAtPoint = getShadowElementFromPoint(lightElAtPoint, x, y)

  debug('visibleAtPoint', el, elAtPoint)

  if (!elAtPoint) return false

  if (elAtPoint === el) return true

  // Shadow-aware ancestor walk: findParent crosses shadow boundaries via getRootNode().host.
  return findParent(elAtPoint, (parent: HTMLElement) => parent === el ? parent : null) === el
})

export function fastIsHidden (subject: JQuery<HTMLElement> | HTMLElement, options: { checkOpacity: boolean } = { checkOpacity: true }): boolean {
  debug('fastIsHidden', subject)

  if (isBody(subject) || isHTML(subject)) {
    return false
  }

  if (isJquery(subject)) {
    const subjects = unwrap(subject) as HTMLElement | HTMLElement[]

    if (Array.isArray(subjects)) {
      return subjects.some((subject: HTMLElement) => fastIsHidden(subject, options))
    }

    return fastIsHidden(subjects, options)
  }

  if (isOption(subject) || isOptgroup(subject)) {
    if (subject.hasAttribute('style') && subject.style.display === 'none') {
      return true
    }

    const select = subject.closest('select')

    if (select) {
      return fastIsHidden(wrap(select), options)
    }
  }

  // contentVisibilityAuto is a valid browser API but not yet in TypeScript's CheckVisibilityOptions
  if (!subject.checkVisibility({
    contentVisibilityAuto: true,
    opacityProperty: options.checkOpacity,
    visibilityProperty: true,
  } as CheckVisibilityOptions)) {
    return true
  }

  let boundingRect = getBoundingClientRect(subject)

  // Don't scroll if the subject is out-of-bounds of a clipping ancestor on the
  // off-screen axis — `scrollIntoView` would programmatically scroll the
  // clipping container and surface content the test author intentionally
  // clipped. When the subject is *in-bounds* of its clipping ancestor (just
  // below the fold), scrolling is safe and necessary to bring it into view.
  if (isOutsideViewport(subject, boundingRect) && !isClippedByAncestor(subject, boundingRect)) {
    const scrollBehavior = Cypress.config('scrollBehavior')

    if (scrollBehavior !== false) {
      const block = scrollBehaviorOptionsMap[scrollBehavior as string] || 'start'

      subject.scrollIntoView({ block, behavior: 'instant' as ScrollBehavior })
      boundingRect = subject.getBoundingClientRect()
    }
  }

  if (visibleToUser(subject, boundingRect)) {
    debug('visibleToUser', subject, boundingRect)

    return false
  }

  return true
}

function visibleToUser (el: HTMLElement, rect: DOMRect, maxDepth: number = 2, currentDepth: number = 0): boolean {
  if (currentDepth >= maxDepth) {
    return false
  }

  const { x, y, width, height } = rect

  const samples = [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
    [x + width / 2, y + height / 2],
  ]

  if (samples.some(([x, y]) => visibleAtPoint(el, x, y))) {
    debug('some samples are visible')

    return true
  }

  const subRects = subDivideRect(rect)

  debug('subRects', subRects)

  return subRects.some((subRect: DOMRect) => {
    return visibleToUser(el, subRect, maxDepth, currentDepth + 1)
  })
}

function isOutsideViewport (el: HTMLElement, rect: DOMRect): boolean {
  const win = el.ownerDocument.defaultView

  if (!win) return false

  return (
    rect.bottom <= 0 ||
    rect.right <= 0 ||
    rect.top >= win.innerHeight ||
    rect.left >= win.innerWidth
  )
}

const CLIPPING_OVERFLOW = new Set(['hidden', 'clip', 'scroll', 'auto'])
// On the document root (`<body>`/`<html>`), only treat overflow as clipping when
// it is *explicitly* `hidden` or `clip`. `scroll` and `auto` here are usually
// the page's scroll container — and per the CSS spec, setting one axis to a
// non-`visible` value (e.g. `body { overflow-x: hidden }`) computes the other
// axis to `auto`. Treating that auto-converted value as clipping would block
// programmatic vertical scroll on every page that hides horizontal scrollbars.
const DOC_ROOT_CLIPPING_OVERFLOW = new Set(['hidden', 'clip'])

// True iff some ancestor with clipping `overflow` on the same axis the subject is
// off-screen has the subject *out-of-bounds* — i.e., the subject is intentionally
// clipped from the user's view. Subjects merely below the fold of an in-bounds
// clipping ancestor are not "clipped"; they're just scrolled away.
//
// Walk via getParentNode so the search crosses shadow root boundaries — a shadow
// descendant's clipping ancestor often lives in the host's light tree. Treat
// `scroll` and `auto` as clipping too: the user has not scrolled, so any content
// outside the visible region is hidden right now and should not be surfaced
// programmatically. The exception is `<body>`/`<html>` (see
// `DOC_ROOT_CLIPPING_OVERFLOW`).
function isClippedByAncestor (el: HTMLElement, rect: DOMRect): boolean {
  const doc = el.ownerDocument
  const win = doc.defaultView

  if (!win) return false

  const offscreenX = rect.right <= 0 || rect.left >= win.innerWidth
  const offscreenY = rect.bottom <= 0 || rect.top >= win.innerHeight

  let current: HTMLElement | null = getParentNode(el)

  while (current) {
    const isDocRoot = current === doc.body || current === doc.documentElement
    const allowed = isDocRoot ? DOC_ROOT_CLIPPING_OVERFLOW : CLIPPING_OVERFLOW
    const { overflowX, overflowY } = win.getComputedStyle(current)
    const clipsX = offscreenX && allowed.has(overflowX)
    const clipsY = offscreenY && allowed.has(overflowY)

    if (clipsX || clipsY) {
      const ancestorRect = current.getBoundingClientRect()

      // Treat the subject as clipped only when it is *fully outside* the
      // ancestor on the off-screen axis. Partial overlap means the subject
      // has visible pixels inside the ancestor's clip region, so scrolling
      // is still appropriate.
      if (clipsX && (rect.right <= ancestorRect.left || rect.left >= ancestorRect.right)) {
        return true
      }

      if (clipsY && (rect.bottom <= ancestorRect.top || rect.top >= ancestorRect.bottom)) {
        return true
      }
    }

    current = getParentNode(current)
  }

  return false
}

function subDivideRect ({ x, y, width, height }: DOMRect): DOMRect[] {
  return [
    DOMRect.fromRect({
      x,
      y,
      width: width / 2,
      height: height / 2,
    }),
    DOMRect.fromRect({
      x: x + width / 2,
      y,
      width: width / 2,
      height: height / 2,
    }),
    DOMRect.fromRect({
      x,
      y: y + height / 2,
      width: width / 2,
      height: height / 2,
    }),
    DOMRect.fromRect({
      x: x + width / 2,
      y: y + height / 2,
      width: width / 2,
      height: height / 2,
    }),
  ].filter((rect: DOMRect) => rect.width > 1 && rect.height > 1)
}
