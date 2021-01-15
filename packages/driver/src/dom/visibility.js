const _ = require('lodash')

const $jquery = require('./jquery')
const $document = require('./document')
const $elements = require('./elements')
const $coordinates = require('./coordinates')
const $transform = require('./transform')

const fixedOrAbsoluteRe = /(fixed|absolute)/

const OVERFLOW_PROPS = ['hidden', 'scroll', 'auto']

const isVisible = (el) => {
  return !isHidden(el, 'isVisible()')
}

// TODO: we should prob update dom
// to be passed in $utils as a dependency
// because of circular references
// the ignoreOpacity option exists for checking actionability
// as elements with `opacity: 0` are hidden yet actionable
const isHidden = (el, methodName = 'isHidden()', options = { checkOpacity: true }) => {
  if (!$elements.isElement(el)) {
    throw new Error(`\`Cypress.dom.${methodName}\` failed because it requires a DOM element. The subject received was: \`${el}\``)
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
      return isHidden($select[0], methodName)
    }
  }

  // in Cypress-land we consider the element hidden if
  // either its offsetHeight or offsetWidth is 0 because
  // it is impossible for the user to interact with this element
  if (elHasNoEffectiveWidthOrHeight($el)) {
    // https://github.com/cypress-io/cypress/issues/6183
    if (elHasDisplayInline($el)) {
      return !elHasVisibleChild($el)
    }

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
  if ($transform.detectVisibility($el) !== 'visible') {
    return true
  }

  // a transparent element is hidden
  if (elHasOpacityZero($el) && options.checkOpacity) {
    return true
  }

  // we do some calculations taking into account the parents
  // to see if its hidden by a parent
  if (elIsHiddenByAncestors($el, options.checkOpacity)) {
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

  const el = $el[0]
  const style = getComputedStyle(el)
  const transform = style.getPropertyValue('transform')
  const width = elOffsetWidth($el)
  const height = elOffsetHeight($el)
  const overflowHidden = elHasOverflowHidden($el)

  return isZeroLengthAndTransformNone(width, height, transform) ||
  isZeroLengthAndOverflowHidden(width, height, overflowHidden) ||
  (el.getClientRects().length <= 0)
}

const isZeroLengthAndTransformNone = (width, height, transform) => {
  // From https://github.com/cypress-io/cypress/issues/5974,
  // we learned that when an element has non-'none' transform style value like "translate(0, 0)",
  // it is visible even with `height: 0` or `width: 0`.
  // That's why we're checking `transform === 'none'` together with elOffsetWidth/Height.

  return (width <= 0 && transform === 'none') ||
  (height <= 0 && transform === 'none')
}

const isZeroLengthAndOverflowHidden = (width, height, overflowHidden) => {
  return (width <= 0 && overflowHidden) ||
  (height <= 0 && overflowHidden)
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

const elHasVisibilityCollapse = ($el) => {
  return $el.css('visibility') === 'collapse'
}

const elHasOpacityZero = ($el) => {
  return $el.css('opacity') === '0'
}

const elHasDisplayNone = ($el) => {
  return $el.css('display') === 'none'
}

const elHasDisplayInline = ($el) => {
  return $el.css('display') === 'inline'
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
  const $offsetParent = $el.offsetParent()

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
  const parents = $elements.getAllParents($child[0], $parent)
  const $els = $jquery.wrap(parents).add($child)

  return _.some($els.get(), (el) => {
    return fixedOrAbsoluteRe.test($jquery.wrap(el).css('position'))
  })
}

const elHasVisibleChild = function ($el) {
  return _.some($el.children(), (el) => {
    return isVisible(el)
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
  if ($elements.isDescendent($el, $elAtPoint)) {
    return false
  }

  // we also check if the element at point is a
  // parent since pointer-events: none
  // will cause elAtCenterPoint to fall through to parent
  if (
    ($el.css('pointer-events') === 'none' || $el.parent().css('pointer-events') === 'none') &&
    ($elAtPoint && $elements.isAncestor($el, $elAtPoint))
  ) {
    return false
  }

  return true
}

const elIsOutOfBoundsOfAncestorsOverflow = function ($el, $ancestor = $elements.getParent($el)) {
  // no ancestor, not out of bounds!
  // if we've reached the top parent, which is not a normal DOM el
  // then we're in bounds all the way up, return false
  if ($elements.isUndefinedOrHTMLBodyDoc($ancestor)) {
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

  return elIsOutOfBoundsOfAncestorsOverflow($el, $elements.getParent($ancestor))
}

const elIsHiddenByAncestors = function ($el, checkOpacity, $origEl = $el) {
  // walk up to each parent until we reach the body
  // if any parent has opacity: 0
  // or has an effective offsetHeight of 0
  // and its set overflow: hidden then our child element
  // is effectively hidden
  // -----UNLESS------
  // the parent or a descendent has position: absolute|fixed
  const $parent = $elements.getParent($el)

  // stop if we've reached the body or html
  // in case there is no body
  // or if parent is the document which can
  // happen if we already have an <html> element
  if ($elements.isUndefinedOrHTMLBodyDoc($parent)) {
    return false
  }

  // a child can never have a computed opacity
  // greater than that of its parent
  // so if the parent has an opacity of 0, so does the child
  if (elHasOpacityZero($parent) && checkOpacity) {
    return true
  }

  if (elHasOverflowHidden($parent) && elHasNoEffectiveWidthOrHeight($parent)) {
    // if any of the elements between the parent and origEl
    // have fixed or position absolute
    return !elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)
  }

  // continue to recursively walk up the chain until we reach body or html
  return elIsHiddenByAncestors($parent, checkOpacity, $origEl)
}

const parentHasNoOffsetWidthOrHeightAndOverflowHidden = function ($el) {
  // if we've walked all the way up to body or html then return false
  if ($elements.isUndefinedOrHTMLBodyDoc($el)) {
    return false
  }

  // if we have overflow hidden and no effective width or height
  if (elHasOverflowHidden($el) && elHasNoEffectiveWidthOrHeight($el)) {
    return $el
  }

  // continue walking
  return parentHasNoOffsetWidthOrHeightAndOverflowHidden($elements.getParent($el))
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
  return parentHasDisplayNone($elements.getParent($el))
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
  return parentHasVisibilityHidden($elements.getParent($el))
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
  return parentHasVisibilityCollapse($elements.getParent($el))
}

const parentHasOpacityZero = function ($el) {
  // if we've walked all the way up to document then return false
  if (!$el.length || $document.isDocument($el)) {
    return false
  }

  // if we have opacity: 0 then return the $el
  if (elHasOpacityZero($el)) {
    return $el
  }

  // continue walking
  return parentHasOpacityZero($el.parent())
}

/* eslint-disable no-cond-assign */
const getReasonIsHidden = function ($el, options = { checkOpacity: true }) {
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
    return `This element \`${node}\` is not visible because it has CSS property: \`display: none\``
  }

  if ($parent = parentHasDisplayNone($elements.getParent($el))) {
    parentNode = $elements.stringify($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`display: none\``
  }

  if ($parent = parentHasVisibilityHidden($elements.getParent($el))) {
    parentNode = $elements.stringify($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`visibility: hidden\``
  }

  if ($parent = parentHasVisibilityCollapse($elements.getParent($el))) {
    parentNode = $elements.stringify($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`visibility: collapse\``
  }

  if ($elements.isDetached($el)) {
    return `This element \`${node}\` is not visible because it is detached from the DOM`
  }

  if (elHasVisibilityHidden($el)) {
    return `This element \`${node}\` is not visible because it has CSS property: \`visibility: hidden\``
  }

  if (elHasVisibilityCollapse($el)) {
    return `This element \`${node}\` is not visible because it has CSS property: \`visibility: collapse\``
  }

  if (elHasOpacityZero($el) && options.checkOpacity) {
    return `This element \`${node}\` is not visible because it has CSS property: \`opacity: 0\``
  }

  if (($parent = parentHasOpacityZero($el.parent())) && options.checkOpacity) {
    parentNode = $elements.stringify($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`opacity: 0\``
  }

  if (elHasNoOffsetWidthOrHeight($el)) {
    return `This element \`${node}\` is not visible because it has an effective width and height of: \`${width} x ${height}\` pixels.`
  }

  const transformResult = $transform.detectVisibility($el)

  if (transformResult === 'transformed') {
    return `This element \`${node}\` is not visible because it is hidden by transform.`
  }

  if (transformResult === 'backface') {
    return `This element \`${node}\` is not visible because it is rotated and its backface is hidden.`
  }

  if ($parent = parentHasNoOffsetWidthOrHeightAndOverflowHidden($elements.getParent($el))) {
    parentNode = $elements.stringify($parent, 'short')
    width = elOffsetWidth($parent)
    height = elOffsetHeight($parent)

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`overflow: hidden\` and an effective width and height of: \`${width} x ${height}\` pixels.`
  }

  // nested else --___________--
  if (elOrAncestorIsFixed($el)) {
    if (elIsNotElementFromPoint($el)) {
      // show the long element here
      const covered = $elements.stringify(elAtCenterPoint($el))

      if (covered) {
        return `This element \`${node}\` is not visible because it has CSS property: \`position: fixed\` and it's being covered by another element:\n\n\`${covered}\``
      }

      return `This element \`${node}\` is not visible because its ancestor has \`position: fixed\` CSS property and it is overflowed by other elements. How about scrolling to the element with \`cy.scrollIntoView()\`?`
    }
  } else {
    if (elIsOutOfBoundsOfAncestorsOverflow($el)) {
      return `This element \`${node}\` is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: \`hidden\`, \`scroll\` or \`auto\``
    }
  }

  return `This element \`${node}\` is not visible.`
}
/* eslint-enable no-cond-assign */

module.exports = {
  isVisible,

  isHidden,

  parentHasDisplayNone,

  getReasonIsHidden,
}
