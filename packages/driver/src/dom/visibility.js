const _ = require('lodash')

const $jquery = require('./jquery')
const $document = require('./document')
const $elements = require('./elements')
const $coordinates = require('./coordinates')

const fixedOrAbsoluteRe = /(fixed|absolute)/

const OVERFLOW_PROPS = ['hidden', 'scroll', 'auto']

const isVisible = (el) => {
  return !isHidden(el, 'isVisible()')
}

// TODO: we should prob update dom
// to be passed in $utils as a dependency
// because of circular references
const isHidden = (el, name = 'isHidden()') => {
  if (!$elements.isElement(el)) {
    throw new Error(`Cypress.dom.${name} failed because it requires a DOM element. The subject received was: '${el}'`)
  }

  const $el = $jquery.wrap(el)

  // the body and html are always visible
  if ($elements.isBody(el) || $elements.isHTML(el)) {
    return false // is visible
  }

  // an option is considered visible if its parent select is visible
  if ($elements.isOption(el) || $elements.isOptgroup(el)) {
    // they could have just set to hide the option
    if (elHasDisplayNone($el)) {
      return true
    }

    // if its parent select is visible, then it's not hidden
    const $select = $elements.getFirstParentWithTagName($el, 'select')

    // check $select.length here first
    // they may have not put the option into a select el,
    // in which case it will fall through to regular visibility logic
    if ($select && $select.length) {
      // if the select is hidden, the options in it are visible too
      return isHidden($select[0], name)
    }
  }

  // in Cypress-land we consider the element hidden if
  // either its offsetHeight or offsetWidth is 0 because
  // it is impossible for the user to interact with this element
  if (elHasNoEffectiveWidthOrHeight($el)) {
    return true // is hidden
  }

  // additionally if the effective visibility of the element
  // is hidden (which includes any parent nodes) then the user
  // cannot interact with this element and thus it is hidden
  if (elHasVisibilityHiddenOrCollapse($el)) {
    return true // is hidden
  }

  // when an element is scaled to 0 in one axis
  // it is not visible to users.
  // So, it is hidden.
  if (elIsHiddenByTransform($el)) {
    return true
  }

  if (elIsBackface($el)) {
    return true
  }

  // we do some calculations taking into account the parents
  // to see if its hidden by a parent
  if (elIsHiddenByAncestors($el)) {
    return true // is hidden
  }

  if (elOrAncestorIsFixed($el)) {
    return elIsNotElementFromPoint($el)
  }

  // else check if el is outside the bounds
  // of its ancestors overflow
  return elIsOutOfBoundsOfAncestorsOverflow($el)
}

const elHasNoEffectiveWidthOrHeight = ($el) => {
  // Is the element's CSS width OR height, including any borders,
  // padding, and vertical scrollbars (if rendered) less than 0?
  //
  // elOffsetWidth:
  // If the element is hidden (for example, by setting style.display
  // on the element or one of its ancestors to "none"), then 0 is returned.

  // $el[0].getClientRects().length:
  // For HTML <area> elements, SVG elements that do not render anything themselves,
  // display:none elements, and generally any elements that are not directly rendered,
  // an empty list is returned.

  return (elOffsetWidth($el) <= 0) || (elOffsetHeight($el) <= 0) || ($el[0].getClientRects().length <= 0)
}

const elHasNoOffsetWidthOrHeight = ($el) => {
  return (elOffsetWidth($el) <= 0) || (elOffsetHeight($el) <= 0)
}

const elOffsetWidth = ($el) => {
  return $el[0].offsetWidth
}

const elOffsetHeight = ($el) => {
  return $el[0].offsetHeight
}

const elHasVisibilityHiddenOrCollapse = ($el) => {
  return elHasVisibilityHidden($el) || elHasVisibilityCollapse($el)
}

const elHasVisibilityHidden = ($el) => {
  return $el.css('visibility') === 'hidden'
}

const numberRegex = /-?[0-9]+(?:\.[0-9]+)?/g
// This is a simplified version of backface culling.
// https://en.wikipedia.org/wiki/Back-face_culling
//
// We defined view normal vector, (0, 0, -1), - eye to screen.
// and default normal vector, (0, 0, 1)
// When dot product of them are >= 0, item is visible.
const elIsBackface = ($el) => {
  const el = $el[0]
  const style = getComputedStyle(el)
  const backface = style.getPropertyValue('backface-visibility')
  const backfaceInvisible = backface === 'hidden'
  const transform = style.getPropertyValue('transform')

  if (!backfaceInvisible || !transform.startsWith('matrix3d')) {
    return false
  }

  const m3d = transform.substring(8).match(numberRegex)
  const defaultNormal = [0, 0, -1]
  const elNormal = findNormal(m3d)
  // Simplified dot product.
  // [0] and [1] are always 0
  const dot = defaultNormal[2] * elNormal[2]

  return dot >= 0
}

const findNormal = (m) => {
  const length = Math.sqrt(+m[8] * +m[8] + +m[9] * +m[9] + +m[10] * +m[10])

  return [+m[8] / length, +m[9] / length, +m[10] / length]
}

const elHasVisibilityCollapse = ($el) => {
  return $el.css('visibility') === 'collapse'
}

// This function checks 2 things that can happen: scale and rotate
const elIsHiddenByTransform = ($el) => {
  // We need to see the final calculation of the element.
  const el = $el[0]

  const style = window.getComputedStyle(el)
  const transform = style.getPropertyValue('transform')

  // Test scaleZ(0)
  // width or height of getBoundingClientRect aren't 0 when scaleZ(0).
  // But it is invisible.
  // Experiment -> https://codepen.io/sainthkh/pen/LYYQGpm
  // That's why we're checking transfomation matrix here.
  //
  // To understand how this part works,
  // you need to understand tranformation matrix first.
  // Matrix is hard to explain with only text. So, check these articles.
  //
  // https://www.useragentman.com/blog/2011/01/07/css3-matrix-transform-for-the-mathematically-challenged/
  // https://en.wikipedia.org/wiki/Rotation_matrix#In_three_dimensions
  //
  if (transform.startsWith('matrix3d')) {
    const m3d = transform.substring(8).match(numberRegex)

    // Z Axis values
    if (+m3d[2] === 0 && +m3d[6] === 0 && +m3d[10] === 0) {
      return true
    }
  }

  // Other cases
  if (transform !== 'none') {
    const { width, height } = el.getBoundingClientRect()

    if (width === 0 || height === 0) {
      return true
    }
  }

  return false
}

const elHasDisplayNone = ($el) => {
  return $el.css('display') === 'none'
}

const elHasOverflowHidden = function ($el) {
  const cssOverflow = [$el.css('overflow'), $el.css('overflow-y'), $el.css('overflow-x')]

  return cssOverflow.includes('hidden')
}

const elHasPositionRelative = ($el) => {
  return $el.css('position') === 'relative'
}

const elHasPositionAbsolute = ($el) => {
  return $el.css('position') === 'absolute'
}

const elHasClippableOverflow = function ($el) {
  return OVERFLOW_PROPS.includes($el.css('overflow')) ||
          OVERFLOW_PROPS.includes($el.css('overflow-y')) ||
            OVERFLOW_PROPS.includes($el.css('overflow-x'))
}

const canClipContent = function ($el, $ancestor) {
  // can't clip without overflow properties
  if (!elHasClippableOverflow($ancestor)) {
    return false
  }

  // the closest parent with position relative, absolute, or fixed
  const $offsetParent = $jquery.wrap($el.offsetParent()[0])

  // even if ancestors' overflow is clippable, if the element's offset parent
  // is a parent of the ancestor, the ancestor will not clip the element
  // unless the element is position relative
  if (!elHasPositionRelative($el) && $elements.isAncestor($ancestor, $offsetParent)) {
    return false
  }

  // even if ancestors' overflow is clippable, if the element's offset parent
  // is a child of the ancestor, the ancestor will not clip the element
  // unless the ancestor has position absolute
  if (elHasPositionAbsolute($offsetParent) && $elements.isChild($ancestor, $offsetParent)) {
    return false
  }

  return true
}

const elOrAncestorIsFixed = function ($el) {
  const $stickyOrFixedEl = $elements.getFirstFixedOrStickyPositionParent($el)

  if ($stickyOrFixedEl) {
    return $stickyOrFixedEl.css('position') === 'fixed'
  }
}

const elAtCenterPoint = function ($el) {
  const doc = $document.getDocumentFromElement($el.get(0))
  const elProps = $coordinates.getElementPositioning($el)

  const { topCenter, leftCenter } = elProps.fromElViewport

  const el = $coordinates.getElementAtPointFromViewport(doc, leftCenter, topCenter)

  if (el) {
    return $jquery.wrap(el)
  }
}

const elDescendentsHavePositionFixedOrAbsolute = function ($parent, $child) {
  // create an array of all elements between $parent and $child
  // including child but excluding parent
  // and check if these have position fixed|absolute
  const $els = $child.parentsUntil($parent).add($child)

  return _.some($els.get(), (el) => {
    return fixedOrAbsoluteRe.test($jquery.wrap(el).css('position'))
  })
}

const elIsNotElementFromPoint = function ($el) {
  // if we have a fixed position element that means
  // it is fixed 'relative' to the viewport which means
  // it MUST be available with elementFromPoint because
  // that is also relative to the viewport
  const $elAtPoint = elAtCenterPoint($el)

  // if the element at point is not a descendent
  // of our $el then we know it's being covered or its
  // not visible
  return !$elements.isDescendent($el, $elAtPoint)
}

const elIsOutOfBoundsOfAncestorsOverflow = function ($el, $ancestor = $el.parent()) {
  // no ancestor, not out of bounds!
  if (!$ancestor) {
    return false
  }

  // if we've reached the top parent, which is document
  // then we're in bounds all the way up, return false
  if ($ancestor.is('body,html') || $document.isDocument($ancestor)) {
    return false
  }

  const elProps = $coordinates.getElementPositioning($el)

  if (canClipContent($el, $ancestor)) {
    const ancestorProps = $coordinates.getElementPositioning($ancestor)

    // target el is out of bounds
    if (
      // target el is to the right of the ancestor's visible area
      (elProps.fromElWindow.left > (ancestorProps.width + ancestorProps.fromElWindow.left)) ||

      // target el is to the left of the ancestor's visible area
      ((elProps.fromElWindow.left + elProps.width) < ancestorProps.fromElWindow.left) ||

      // target el is under the ancestor's visible area
      (elProps.fromElWindow.top > (ancestorProps.height + ancestorProps.fromElWindow.top)) ||

      // target el is above the ancestor's visible area
      ((elProps.fromElWindow.top + elProps.height) < ancestorProps.fromElWindow.top)
    ) {
      return true
    }
  }

  return elIsOutOfBoundsOfAncestorsOverflow($el, $ancestor.parent())
}

const elIsHiddenByAncestors = function ($el, $origEl = $el) {
  // walk up to each parent until we reach the body
  // if any parent has an effective offsetHeight of 0
  // and its set overflow: hidden then our child element
  // is effectively hidden
  // -----UNLESS------
  // the parent or a descendent has position: absolute|fixed
  const $parent = $el.parent()

  // stop if we've reached the body or html
  // in case there is no body
  // or if parent is the document which can
  // happen if we already have an <html> element
  if (!$parent.length || $parent.is('body,html') || $document.isDocument($parent)) {
    return false
  }

  if (elHasOverflowHidden($parent) && elHasNoEffectiveWidthOrHeight($parent)) {
    // if any of the elements between the parent and origEl
    // have fixed or position absolute
    return !elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)
  }

  if (elIsHiddenByTransform($parent)) {
    return true
  }

  if (elIsBackface($parent)) {
    return true
  }

  // continue to recursively walk up the chain until we reach body or html
  return elIsHiddenByAncestors($parent, $origEl)
}

const parentHasNoOffsetWidthOrHeightAndOverflowHidden = function ($el) {
  // if we've walked all the way up to body or html then return false
  if (!$el.length || $el.is('body,html')) {
    return false
  }

  // if we have overflow hidden and no effective width or height
  if (elHasOverflowHidden($el) && elHasNoEffectiveWidthOrHeight($el)) {
    return $el
  }

  // continue walking
  return parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())
}

const parentHasDisplayNone = function ($el) {
  // if we have no $el or we've walked all the way up to document
  // then return false
  if (!$el.length || $document.isDocument($el)) {
    return false
  }

  // if we have display none then return the $el
  if (elHasDisplayNone($el)) {
    return $el
  }

  // continue walking
  return parentHasDisplayNone($el.parent())
}

const parentHasVisibilityHidden = function ($el) {
  // if we've walked all the way up to document then return false
  if (!$el.length || $document.isDocument($el)) {
    return false
  }

  // if we have display none then return the $el
  if (elHasVisibilityHidden($el)) {
    return $el
  }

  // continue walking
  return parentHasVisibilityHidden($el.parent())
}

const parentHasVisibilityCollapse = function ($el) {
  // if we've walked all the way up to document then return false
  if (!$el.length || $document.isDocument($el)) {
    return false
  }

  // if we have display none then return the $el
  if (elHasVisibilityCollapse($el)) {
    return $el
  }

  // continue walking
  return parentHasVisibilityCollapse($el.parent())
}

/* eslint-disable no-cond-assign */
const getReasonIsHidden = function ($el) {
  // TODO: need to add in the reason an element
  // is hidden when its fixed position and its
  // either being covered or there is no el

  const node = $elements.stringify($el, 'short')
  let width = elOffsetWidth($el)
  let height = elOffsetHeight($el)
  let $parent
  let parentNode

  // returns the reason in human terms why an element is considered not visible
  if (elHasDisplayNone($el)) {
    return `This element '${node}' is not visible because it has CSS property: 'display: none'`
  }

  if ($parent = parentHasDisplayNone($el.parent())) {
    parentNode = $elements.stringify($parent, 'short')

    return `This element '${node}' is not visible because its parent '${parentNode}' has CSS property: 'display: none'`
  }

  if ($parent = parentHasVisibilityHidden($el.parent())) {
    parentNode = $elements.stringify($parent, 'short')

    return `This element '${node}' is not visible because its parent '${parentNode}' has CSS property: 'visibility: hidden'`
  }

  if ($parent = parentHasVisibilityCollapse($el.parent())) {
    parentNode = $elements.stringify($parent, 'short')

    return `This element '${node}' is not visible because its parent '${parentNode}' has CSS property: 'visibility: collapse'`
  }

  if ($elements.isDetached($el)) {
    return `This element '${node}' is not visible because it is detached from the DOM`
  }

  if (elHasVisibilityHidden($el)) {
    return `This element '${node}' is not visible because it has CSS property: 'visibility: hidden'`
  }

  if (elHasVisibilityCollapse($el)) {
    return `This element '${node}' is not visible because it has CSS property: 'visibility: collapse'`
  }

  if (elHasNoOffsetWidthOrHeight($el)) {
    return `This element '${node}' is not visible because it has an effective width and height of: '${width} x ${height}' pixels.`
  }

  if (elIsHiddenByTransform($el)) {
    return `This element '${node}' is not visible because it is hidden by transform.`
  }

  if (elIsBackface($el)) {
    return `This element '${node}' is not visible because it is rotated and its backface is hidden.`
  }

  if ($parent = parentHasNoOffsetWidthOrHeightAndOverflowHidden($el.parent())) {
    parentNode = $elements.stringify($parent, 'short')
    width = elOffsetWidth($parent)
    height = elOffsetHeight($parent)

    return `This element '${node}' is not visible because its parent '${parentNode}' has CSS property: 'overflow: hidden' and an effective width and height of: '${width} x ${height}' pixels.`
  }

  // nested else --___________--
  if (elOrAncestorIsFixed($el)) {
    if (elIsNotElementFromPoint($el)) {
      // show the long element here
      const covered = $elements.stringify(elAtCenterPoint($el))

      if (covered) {
        return `\
This element '${node}' is not visible because it has CSS property: 'position: fixed' and its being covered by another element:

${covered}\
`
      }

      return `This element '${node}' is not visible because its ancestor has 'position: fixed' CSS property and it is overflowed by other elements. How about scrolling to the element with cy.scrollIntoView()?`
    }
  } else {
    if (elIsOutOfBoundsOfAncestorsOverflow($el)) {
      return `This element '${node}' is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: 'hidden', 'scroll' or 'auto'`
    }
  }

  return `Cypress could not determine why this element '${node}' is not visible.`
}
/* eslint-enable no-cond-assign */

module.exports = {
  isVisible,

  isHidden,

  parentHasDisplayNone,

  getReasonIsHidden,
}
