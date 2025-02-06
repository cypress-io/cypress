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

  const box: Box = {
    // offset disregards margin but takes into account border + padding
    offset: $el.offset(),
    // dont use jquery here for width/height because it uses getBoundingClientRect() which returns scaled values.
    paddingTop: getPadding($el, 'top'),
    paddingRight: getPadding($el, 'right'),
    paddingBottom: getPadding($el, 'bottom'),
    paddingLeft: getPadding($el, 'left'),
    borderTop: getBorder($el, 'top'),
    borderRight: getBorder($el, 'right'),
    borderBottom: getBorder($el, 'bottom'),
    borderLeft: getBorder($el, 'left'),
    marginTop: getMargin($el, 'top'),
    marginRight: getMargin($el, 'right'),
    marginBottom: getMargin($el, 'bottom'),
    marginLeft: getMargin($el, 'left'),
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
type attr = `padding-${dir}` | `border-${dir}-width` | `margin-${dir}`

const getNumAttrValue = ($el: JQuery<HTMLElement>, attr: attr) => {
  // nuke anything thats not a number or a negative symbol
  const num = _.toNumber($el.css(attr).replace(/[^0-9\.-]+/, ''))

  if (!_.isFinite(num)) {
    throw new Error('Element attr did not return a valid number')
  }

  return num
}

const getPadding = ($el: JQuery<HTMLElement>, dir: dir) => {
  return getNumAttrValue($el, `padding-${dir}`)
}

const getBorder = ($el: JQuery<HTMLElement>, dir: dir) => {
  return getNumAttrValue($el, `border-${dir}-width`)
}

const getMargin = ($el: JQuery<HTMLElement>, dir: dir) => {
  return getNumAttrValue($el, `margin-${dir}`)
}

export default {
  getElementDimensions,
}
