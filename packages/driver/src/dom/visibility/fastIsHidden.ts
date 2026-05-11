import $elements from '../elements'
import { memoize } from './memoize'
import { unwrap, wrap, isJquery } from '../jquery'
import { scrollBehaviorOptionsMap } from '../../util/scrollBehavior'
import Debug from 'debug'

const debug = Debug('cypress:driver:dom:visibility:fastIsHidden')

const { isOption, isOptgroup, isBody, isHTML } = $elements

const getBoundingClientRect = memoize((el: HTMLElement) => el.getBoundingClientRect())

const visibleAtPoint = memoize(function (el: HTMLElement, x: number, y: number): boolean {
  const elAtPoint = el.ownerDocument.elementFromPoint(x, y)

  debug('visibleAtPoint', el, elAtPoint)

  return Boolean(elAtPoint) && (elAtPoint === el || el.contains(elAtPoint))
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

  // Don't scroll if any ancestor clips the subject in the direction it is
  // off-screen — `scrollIntoView` would scroll the clipping container (it's
  // programmatically scrollable even though it's not user-scrollable) and
  // expose content the test author intentionally clipped.
  if (isOutsideViewport(subject, boundingRect) && !hasClippingAncestor(subject, boundingRect)) {
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

function hasClippingAncestor (el: HTMLElement, rect: DOMRect): boolean {
  const win = el.ownerDocument.defaultView

  if (!win) return false

  // Only ancestors clipping on the off-screen axis matter — e.g. `body { overflow-x: hidden }`
  // (a common pattern to suppress horizontal scrollbars) must not block vertical scrolling
  // for elements below the fold. And the subject must actually be *outside* the ancestor's
  // bounds on that axis — many UI patterns use `overflow: hidden` for cosmetic clipping
  // (border-radius, layout containment) without intent to hide in-bounds content.
  const offscreenX = rect.right <= 0 || rect.left >= win.innerWidth
  const offscreenY = rect.bottom <= 0 || rect.top >= win.innerHeight

  let current: HTMLElement | null = el.parentElement

  while (current) {
    const { overflowX, overflowY } = win.getComputedStyle(current)
    const clipsX = overflowX === 'hidden' || overflowX === 'clip'
    const clipsY = overflowY === 'hidden' || overflowY === 'clip'

    if ((offscreenX && clipsX) || (offscreenY && clipsY)) {
      const ancestorRect = current.getBoundingClientRect()

      if (offscreenX && clipsX && (rect.right <= ancestorRect.left || rect.left >= ancestorRect.right)) {
        return true
      }

      if (offscreenY && clipsY && (rect.bottom <= ancestorRect.top || rect.top >= ancestorRect.bottom)) {
        return true
      }
    }

    current = current.parentElement
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
