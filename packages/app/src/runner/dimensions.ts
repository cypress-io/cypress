export const getElementDimensions = (el: HTMLElement) => {
  const { offsetHeight, offsetWidth } = el

  const paddingTop = getStylePropertyNumber(el, 'padding-top')
  const paddingRight = getStylePropertyNumber(el, 'padding-right')
  const paddingBottom = getStylePropertyNumber(el, 'padding-bottom')
  const paddingLeft = getStylePropertyNumber(el, 'padding-left')
  const borderTop = getStylePropertyNumber(el, 'border-top-width')
  const borderRight = getStylePropertyNumber(el, 'border-right-width')
  const borderBottom = getStylePropertyNumber(el, 'border-bottom-width')
  const borderLeft = getStylePropertyNumber(el, 'border-left-width')
  const marginTop = getStylePropertyNumber(el, 'margin-top')
  const marginRight = getStylePropertyNumber(el, 'margin-right')
  const marginBottom = getStylePropertyNumber(el, 'margin-bottom')
  const marginLeft = getStylePropertyNumber(el, 'margin-left')

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

  const curTop = parseFloat(getComputedStyle(el, null).top)
  const curLeft = parseFloat(getComputedStyle(el, null).left)

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

const getStylePropertyNumber = (el: HTMLElement, property: string) => {
  const value = parseFloat(getComputedStyle(el, null).getPropertyValue(property))

  if (isNaN(value)) {
    throw new Error('Element attr did not return a valid number')
  }

  return value
}
