import $elements from '../elements'

import { unwrap, wrap, isJquery } from '../jquery'
const { isOption, isOptgroup, isBody, isHTML } = $elements

const DEBUG = false

function debug (...args: any[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log('DEBUG:', ...args)
  }
}

function memoize<T> (fn: (...args: any[]) => T): (...args: any[]) => T {
  const objIds = new WeakMap<any, number>()
  let nextObjId = 0
  const cache = new WeakMap<any, { result: T, timestamp: number }>()

  function composeKey (...args: any[]): { key } {
    return {
      key: args.map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          return `${typeof arg}:${arg}`
        }

        if (typeof arg === 'object') {
          if (!objIds.has(arg)) {
            objIds.set(arg, nextObjId)
            nextObjId++
          }

          return `obj:${objIds.get(arg)}`
        }

        return `${typeof arg}:${String(arg)}`
      }).join('|'),
    }
  }

  return (...args: any[]) => {
    const key = composeKey(args)

    const cached = cache.get(key)

    if (cached && cached.timestamp > Date.now() - 100) {
      return cached.result
    }

    const result = fn(...args)

    cache.set(key, { result, timestamp: Date.now() })

    return result
  }
}

const getBoundingClientRect = memoize((el: HTMLElement) => el.getBoundingClientRect())

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

const visibleAtPoint = memoize(function (el: HTMLElement, x: number, y: number): boolean {
  const elAtPoint = el.ownerDocument.elementFromPoint(x, y)

  debug('visibleAtPoint', el, elAtPoint)

  return Boolean(elAtPoint) && (elAtPoint === el || el.contains(elAtPoint))
})

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

  const boundingRect = getBoundingClientRect(subject)

  if (visibleToUser(subject, boundingRect)) {
    debug('visibleToUser', subject, boundingRect)

    return false
  }

  return true
}
