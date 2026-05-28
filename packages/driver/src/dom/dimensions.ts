// NOTE: Non-JQuery version of getElementDimensions is at app/runner/dimensions.
// This duplication of code has been created when migrating legacy runner to app.
// When migrating `driver`, we might need to remove this function and use the `app` version instead.

import _ from 'lodash'

interface Box {
  offset: { top: number, left: number } | undefined
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  borderTop: number
  borderRight: number
  borderBottom: number
  borderLeft: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  width?: number
  height?: number
  heightWithPadding?: number
  heightWithBorder?: number
  heightWithMargin?: number
  widthWithPadding?: number
  widthWithBorder?: number
  widthWithMargin?: number
}

const getElementDimensions = ($el: JQuery<HTMLElement>) => {
  const el: HTMLElement = $el.get(0)

  const { offsetHeight, offsetWidth } = el

  // Call getComputedStyle once and cache the result to avoid
  // multiple layout/reflow operations.
  const computedStyle: CSSStyleDeclaration = getComputedStyle(el, null)

  const box: Box = {
    // offset disregards margin but takes into account border + padding
    offset: $el.offset(),
    // dont use jquery here for width/height because it uses getBoundingClientRect() which returns scaled values.
    // Use cached computedStyle instead of calling $el.css() multiple times
    paddingTop: getPaddingFromStyle(computedStyle, 'top'),
    paddingRight: getPaddingFromStyle(computedStyle, 'right'),
    paddingBottom: getPaddingFromStyle(computedStyle, 'bottom'),
    paddingLeft: getPaddingFromStyle(computedStyle, 'left'),
    borderTop: getBorderFromStyle(computedStyle, 'top'),
    borderRight: getBorderFromStyle(computedStyle, 'right'),
    borderBottom: getBorderFromStyle(computedStyle, 'bottom'),
    borderLeft: getBorderFromStyle(computedStyle, 'left'),
    marginTop: getMarginFromStyle(computedStyle, 'top'),
    marginRight: getMarginFromStyle(computedStyle, 'right'),
    marginBottom: getMarginFromStyle(computedStyle, 'bottom'),
    marginLeft: getMarginFromStyle(computedStyle, 'left'),
  }

  // NOTE: offsetWidth/height always give us content + padding + border, so subtract them
  // to get the true "clientHeight" and "clientWidth".
  // we CANNOT just use "clientHeight" and "clientWidth" because those always return 0
  // for inline elements >_<
  box.width = offsetWidth - (box.paddingLeft + box.paddingRight + box.borderLeft + box.borderRight)
  box.height = offsetHeight - (box.paddingTop + box.paddingBottom + box.borderTop + box.borderBottom)

  // innerHeight: Get the current computed height for the first
  // element in the set of matched elements, including padding but not border.

  // outerHeight: Get the current computed height for the first
  // element in the set of matched elements, including padding, border,
  // and optionally margin. Returns a number (without 'px') representation
  // of the value or null if called on an empty set of elements.
  box.heightWithPadding = box.height + box.paddingTop + box.paddingBottom

  box.heightWithBorder = box.heightWithPadding + box.borderTop + box.borderBottom

  box.heightWithMargin = box.heightWithBorder + box.marginTop + box.marginBottom

  box.widthWithPadding = box.width + box.paddingLeft + box.paddingRight

  box.widthWithBorder = box.widthWithPadding + box.borderLeft + box.borderRight

  box.widthWithMargin = box.widthWithBorder + box.marginLeft + box.marginRight

  return box
}

type dir = 'top' | 'right' | 'bottom' | 'left'

// Helper to extract numeric value from computed style property
// Replicates the behavior of $el.css(attr).replace(/[^0-9\.-]+/, '')
const getStylePropertyNumber = (computedStyle: CSSStyleDeclaration, property: string): number => {
  const value = computedStyle.getPropertyValue(property)
  // nuke anything thats not a number or a negative symbol
  const num = _.toNumber(value.replace(/[^0-9\.-]+/, ''))

  if (!_.isFinite(num)) {
    throw new Error('Element attr did not return a valid number')
  }

  return num
}

// Optimized versions that read from cached computedStyle
const getPaddingFromStyle = (computedStyle: CSSStyleDeclaration, dir: dir): number => {
  return getStylePropertyNumber(computedStyle, `padding-${dir}`)
}

const getBorderFromStyle = (computedStyle: CSSStyleDeclaration, dir: dir): number => {
  return getStylePropertyNumber(computedStyle, `border-${dir}-width`)
}

const getMarginFromStyle = (computedStyle: CSSStyleDeclaration, dir: dir): number => {
  return getStylePropertyNumber(computedStyle, `margin-${dir}`)
}

export default {
  getElementDimensions,
}
