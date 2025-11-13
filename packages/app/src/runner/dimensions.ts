export const getElementDimensions = (el: HTMLElement) => {
  const { offsetHeight, offsetWidth } = el

  // Call getComputedStyle once and cache the result to avoid
  // multiple layout/reflow operations.
  const computedStyle: CSSStyleDeclaration = getComputedStyle(el, null)

  const paddingTop = getStylePropertyNumberFromStyle(computedStyle, 'padding-top')
  const paddingRight = getStylePropertyNumberFromStyle(computedStyle, 'padding-right')
  const paddingBottom = getStylePropertyNumberFromStyle(computedStyle, 'padding-bottom')
  const paddingLeft = getStylePropertyNumberFromStyle(computedStyle, 'padding-left')
  const borderTop = getStylePropertyNumberFromStyle(computedStyle, 'border-top-width')
  const borderRight = getStylePropertyNumberFromStyle(computedStyle, 'border-right-width')
  const borderBottom = getStylePropertyNumberFromStyle(computedStyle, 'border-bottom-width')
  const borderLeft = getStylePropertyNumberFromStyle(computedStyle, 'border-left-width')
  const marginTop = getStylePropertyNumberFromStyle(computedStyle, 'margin-top')
  const marginRight = getStylePropertyNumberFromStyle(computedStyle, 'margin-right')
  const marginBottom = getStylePropertyNumberFromStyle(computedStyle, 'margin-bottom')
  const marginLeft = getStylePropertyNumberFromStyle(computedStyle, 'margin-left')

  // NOTE: offsetWidth/height always give us content + padding + border, so subtract them
  // to get the true "clientHeight" and "clientWidth".
  // we CANNOT just use "clientHeight" and "clientWidth" because those always return 0
  // for inline elements >_<
  const width = offsetWidth - (paddingLeft + paddingRight + borderLeft + borderRight)
  const height = offsetHeight - (paddingTop + paddingBottom + borderTop + borderBottom)

  // innerHeight: Get the current computed height for the first
  // element in the set of matched elements, including padding but not border.

  // outerHeight: Get the current computed height for the first
  // element in the set of matched elements, including padding, border,
  // and optionally margin. Returns a number (without 'px') representation
  // of the value or null if called on an empty set of elements.
  const heightWithPadding = height + paddingTop + paddingBottom
  const heightWithBorder = heightWithPadding + borderTop + borderBottom
  const heightWithMargin = heightWithBorder + marginTop + marginBottom
  const widthWithPadding = width + paddingLeft + paddingRight
  const widthWithBorder = widthWithPadding + borderLeft + borderRight
  const widthWithMargin = widthWithBorder + marginLeft + marginRight

  return {
    // offset disregards margin but takes into account border + padding
    offset: getOffset(el),

    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,

    width,
    height,

    heightWithPadding,
    heightWithBorder,
    heightWithMargin,
    widthWithPadding,
    widthWithBorder,
    widthWithMargin,
  }
}

// Cherry picked from https://github.com/jquery/jquery/blob/016872ffe03ab9107b1bc62fae674a4809c3b23f/src/offset.js#L11-L59
export const setOffset = (el: HTMLElement, offset: { top: number, left: number }) => {
  const curOffset = getOffset(el)

  // Cache getComputedStyle result to avoid multiple layout operations
  const computedStyle: CSSStyleDeclaration = getComputedStyle(el, null)
  const curTop = parseFloat(computedStyle.top)
  const curLeft = parseFloat(computedStyle.left)

  el.style.top = `${offset.top - curOffset.top + curTop}px`
  el.style.left = `${offset.left - curOffset.left + curLeft}px`
}

// Cherry picked from https://github.com/jquery/jquery/blob/016872ffe03ab9107b1bc62fae674a4809c3b23f/src/offset.js#L91-L97
export const getOffset = (el: HTMLElement) => {
  // Get document-relative position by adding viewport scroll to viewport-relative gBCR
  const rect = el.getBoundingClientRect()
  const win = el.ownerDocument.defaultView

  return {
    top: rect.top + win!.scrollY,
    left: rect.left + win!.scrollX,
  }
}

const getStylePropertyNumberFromStyle = (computedStyle: CSSStyleDeclaration, property: string): number => {
  const value = parseFloat(computedStyle.getPropertyValue(property))

  if (isNaN(value)) {
    throw new Error('Element attr did not return a valid number')
  }

  return value
}
