import $elements from '../elements'
import fastdom from 'fastdom'

const { isOption, isOptgroup, isBody, isHTML } = $elements

function measure <T> (fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    fastdom.measure(() => {
      try {
        const result = fn()

        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
  })
}

function isRectVisible (el: HTMLElement, { x, y, width, height }: DOMRect): boolean {
  const elAtPoint = el.ownerDocument.elementFromPoint(
    x + width / 2,
    y + height / 2,
  )

  return (Boolean(elAtPoint) && (elAtPoint === el || el.contains(elAtPoint)))
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
  ].filter((rect: DOMRect) => rect.width > 0 && rect.height > 0)
}

export async function fastIsVisible (el: HTMLElement): Promise<boolean> {
  return !(await fastIsHidden(el))
}

export async function fastIsHidden (el: HTMLElement, options: { checkOpacity: boolean } = { checkOpacity: true }): Promise<boolean> {
  // basic css checks
  if (isBody(el) || isHTML(el)) {
    return false
  }

  if (el.computedStyleMap().get('display') === 'none') {
    return true
  }

  if (el.computedStyleMap().get('visibility') === 'hidden' || el.computedStyleMap().get('visibility') === 'collapse') {
    return true
  }

  if (el.computedStyleMap().get('opacity') === 0 && options.checkOpacity) {
    return true
  }

  if (isOption(el) || isOptgroup(el)) {
    const select = el.closest('select')

    if (select) {
      return fastIsHidden(select, options)
    }

    return false // should we consider option/optgroup hidden if it does not have a SELECT parent?
  }

  // by boundingClientRect is less accurate than measuring each clientRect
  // individually, but doesn't have the same issues with svg elements.

  const boundingRect = await measure(() => el.getBoundingClientRect())

  if (boundingRect.width === 0 && boundingRect.height === 0) {
    return true
  }

  if (isRectVisible(el, boundingRect)) {
    return false
  }

  const subSamples = subDivideRect(boundingRect)

  if (subSamples.some((rect: DOMRect) => isRectVisible(el, rect))) {
    return false
  }

  return true

  // if we want to check each clientRect individually, we have to measure
  // svg child elements separately.
  // the viewport for non-outer svg elements is the outer svg element,
  // so svg elements need to be handled differently - in order to raycast,
  // we need the bounding rect of the svg element relative to the browser
  // viewport.
}
