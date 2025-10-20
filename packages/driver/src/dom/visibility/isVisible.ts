import $jquery from '../jquery'
import $elements from '../elements'
import $document from '../document'
import $coordinates from '../coordinates'
import * as $transform from '../transform'

const { isElement, isBody, isHTML, isOption, isOptgroup, getParent, getFirstParentWithTagName, isAncestor, isChild, getAllParents, isDescendent, isUndefinedOrHTMLBodyDoc, elOrAncestorIsFixedOrSticky, isFocusable } = $elements
const { wrap } = $jquery


const OVERFLOW_PROPS = ['hidden', 'clip', 'scroll', 'auto']


interface VisibilityOptions {
  checkOpacity: boolean
}

export function isVisible (el: HTMLElement, methodName = 'isVisible()', options = { checkOpacity: true }): boolean {
  return !isHidden(el, methodName, options)
}

// TODO: we should prob update dom
// to be passed in $utils as a dependency
// because of circular references
// the ignoreOpacity option exists for checking actionability
// as elements with `opacity: 0` are hidden yet actionable
export function isHidden (el, methodName = 'isHidden()', options = { checkOpacity: true }) {
  if (isStrictlyHidden(el, methodName, options, isHidden)) {
    return true
  }

  return isHiddenByAncestors(el, methodName, options)
}

export function isStrictlyHidden (el: HTMLElement, methodName = 'isStrictlyHidden()', options = { checkOpacity: true }, recurse?) {
  ensureEl(el, methodName)
  const $el = $jquery.wrap(el)

  // the body and html are always visible
  if (isBody(el) || isHTML(el)) {
    return false // is visible
  }

  // an option is considered visible if its parent select is visible
  if (isOption(el) || isOptgroup(el)) {
    // they could have just set to hide the option
    if (elHasDisplayNone($el)) {
      return true
    }

    // if its parent select is visible, then it's not hidden
    const $select = getFirstSelectParentFromEl($el)

    if ($select) {
      return recurse ? recurse($select[0], methodName, options) : isStrictlyHidden($select[0], methodName, options)
    }
  }

  // in Cypress-land we consider the element hidden if
  // either its clientHeight or clientWidth is 0 because
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

  return false
}

export function getFirstSelectParentFromEl ($el: JQuery) {
  const $select = getFirstParentWithTagName($el, 'select')

  // check $select.length here first
  // they may have not put the option into a select el
  if ($select?.length) {
    return $select
  }

  return null
}

function ensureEl (el: HTMLElement, methodName: string) {
  if (!isElement(el)) {
    throw new Error(`\`Cypress.dom.${methodName}\` failed because it requires a DOM element. The subject received was: \`${el}\``)
  }
}

export function elHasDisplayNone ($el) {
  return $el.css('display') === 'none'
}

export function isHiddenByAncestors (el: HTMLElement, methodName = 'isHiddenByAncestors()', options: VisibilityOptions = { checkOpacity: true }) {
  ensureEl(el, methodName)
  const $el = $jquery.wrap(el)

  // get the parent element

  if (isOption(el) || isOptgroup(el)) {
    const $select = getFirstSelectParentFromEl($el)

    if ($select) {
      // recursive
      return isHiddenByAncestors($select[0], methodName, options)
    }
  }

  let $parent = getParent($el)

  while (parent && !isUndefinedOrHTMLBodyDoc($parent)) {
    if (elHasOpacityZero($parent) && options.checkOpacity) {
      return true
    }

    if (elHasOverflowHidden($parent) && !elHasDisplayContents($parent) && elHasNoEffectiveWidthOrHeight($parent)) {
      // recursive
      const childrenCheck = !elDescendentsHavePositionFixedOrAbsolute($parent, $el)

      if (childrenCheck) {
        return true
      }
    }

    $parent = getParent($parent)
  }

  $parent = getParent($el)
  let stickyOrFixedParent: JQuery<HTMLElement> | undefined = undefined

  while (parent && !isUndefinedOrHTMLBodyDoc($parent)) {
    const fixedOrSticky = /(fixed|sticky)/.test($parent.css('position'))

    if (fixedOrSticky) {
      stickyOrFixedParent = $parent
      break
    }

    $parent = getParent($parent)
  }

  if (stickyOrFixedParent) {
    return elIsNotElementFromPoint(stickyOrFixedParent)
  }

  $parent = getParent($el)

  while ($parent && !isUndefinedOrHTMLBodyDoc($parent)) {
    if (elHasDisplayContents($parent)) {
      return false
    }
    if (canClipContent($el, $parent)) {
      const ancestorProps = $parent.get(0).getBoundingClientRect()

    if (elHasPositionAbsolute($el) && (ancestorProps.width === 0 || ancestorProps.height === 0)) {
      $parent = getParent($parent)
      continue
    }

    const elProps = $el.get(0).getBoundingClientRect()

    // only check if the target el is out of bounds if the overflow is clippable in that direction
    const checkXOverflow = OVERFLOW_PROPS.includes($ancestor.css('overflow-x'))
    const checkYOverflow = OVERFLOW_PROPS.includes($ancestor.css('overflow-y'))

    // target el is out of bounds
    if (
      // target el is to the right of the ancestor's visible area
      (checkXOverflow && (elProps.left >= (ancestorProps.width + ancestorProps.left))) ||

      // target el is to the left of the ancestor's visible area
      (checkXOverflow && ((elProps.left + elProps.width) <= ancestorProps.left)) ||

      // target el is under the ancestor's visible area
      (checkYOverflow && (elProps.top >= (ancestorProps.height + ancestorProps.top))) ||

      // target el is above the ancestor's visible area
      (checkYOverflow && ((elProps.top + elProps.height) <= ancestorProps.top))
    ) {
      return true
    }

  if (elIsOutOfBoundsOfAncestorsOverflow($parent)) {
    return true
  }

  // else check if el is outside the bounds
  // of its ancestors overflow
  return elIsOutOfBoundsOfAncestorsOverflow($el)
}

function elIsHiddenByAncestors ($el, checkOpacity, $origEl = $el) {
  // walk up to each parent until we reach the body
  // if any parent has opacity: 0
  // or has an effective clientHeight of 0
  // and its set overflow: hidden then our child element
  // is effectively hidden
  // -----UNLESS------
  // the parent or a descendent has position: absolute|fixed
  const $parent = getParent($el)

  // stop if we've reached the body or html
  // in case there is no body
  // or if parent is the document which can
  // happen if we already have an <html> element
  if (isUndefinedOrHTMLBodyDoc($parent)) {
    return false
  }

  if (elHasDisplayContents($el)) {
    let $parent = getParent($el)

    return elIsHiddenByAncestors($parent, checkOpacity, $parent)
  }

  // a child can never have a computed opacity
  // greater than that of its parent
  // so if the parent has an opacity of 0, so does the child
  if (elHasOpacityZero($parent) && checkOpacity) {
    return true
  }

  if (elHasOverflowHidden($parent) && !elHasDisplayContents($parent) && elHasNoEffectiveWidthOrHeight($parent)) {
    // if any of the elements between the parent and origEl have fixed or position absolute
    return !elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)
  }

  // continue to recursively walk up the chain until we reach body or html
  return elIsHiddenByAncestors($parent, checkOpacity, $origEl)
}

export function elIsNotElementFromPoint ($el: JQuery<HTMLElement>) {
  // if we have a fixed position element that means
  // it is fixed 'relative' to the viewport which means
  // it MUST be available with elementFromPoint because
  // that is also relative to the viewport
  const $elAtPoint = elAtCenterPoint($el)

  // if the element at point is not a descendent
  // of our $el then we know it's being covered or its
  // not visible
  if (isDescendent($el, $elAtPoint)) {
    return false
  }

  // we also check if the element at point is a
  // parent since pointer-events: none
  // will cause elAtCenterPoint to fall through to parent
  if (
    ($el.css('pointer-events') === 'none' || $el.parent().css('pointer-events') === 'none') &&
    ($elAtPoint && isAncestor($el, $elAtPoint))
  ) {
    return false
  }

  return true
}

export function elAtCenterPoint ($el: JQuery<HTMLElement>) {
  const doc = $document.getDocumentFromElement($el.get(0))
  const elProps = $coordinates.getElementPositioning($el)

  const { topCenter, leftCenter } = elProps.fromElViewport

  const el = $coordinates.getElementAtPointFromViewport(doc, leftCenter, topCenter)

  if (el) {
    return $jquery.wrap(el)
  }

  return undefined
}

export function elIsOutOfBoundsOfAncestorsOverflow ($el: JQuery<any>, $ancestor = getParent($el)) {
  // no ancestor, not out of bounds!
  // if we've reached the top parent, which is not a normal DOM el
  // then we're in bounds all the way up, return false
  if (isUndefinedOrHTMLBodyDoc($ancestor)) {
    return false
  }

  if (elHasDisplayContents($el)) {
    return false
  }

  if (canClipContent($el, $ancestor)) {
    const ancestorProps = $ancestor.get(0).getBoundingClientRect()

    if (elHasPositionAbsolute($el) && (ancestorProps.width === 0 || ancestorProps.height === 0)) {
      return elIsOutOfBoundsOfAncestorsOverflow($el, getParent($ancestor))
    }

    const elProps = $el.get(0).getBoundingClientRect()

    // only check if the target el is out of bounds if the overflow is clippable in that direction
    const checkXOverflow = OVERFLOW_PROPS.includes($ancestor.css('overflow-x'))
    const checkYOverflow = OVERFLOW_PROPS.includes($ancestor.css('overflow-y'))

    // target el is out of bounds
    if (
      // target el is to the right of the ancestor's visible area
      (checkXOverflow && (elProps.left >= (ancestorProps.width + ancestorProps.left))) ||

      // target el is to the left of the ancestor's visible area
      (checkXOverflow && ((elProps.left + elProps.width) <= ancestorProps.left)) ||

      // target el is under the ancestor's visible area
      (checkYOverflow && (elProps.top >= (ancestorProps.height + ancestorProps.top))) ||

      // target el is above the ancestor's visible area
      (checkYOverflow && ((elProps.top + elProps.height) <= ancestorProps.top))
    ) {
      return true
    }
  }

  return elIsOutOfBoundsOfAncestorsOverflow($el, getParent($ancestor))
}

function elHasDisplayContents ($el) {
  return $el.css('display') === 'contents'
}

export function elHasOpacityZero ($el) {
  return $el.css('opacity') === '0'
}

function elHasDisplayInline ($el) {
  return $el.css('display') === 'inline'
}

function elHasVisibilityHiddenOrCollapse ($el) {
  return elHasVisibilityHidden($el) || elHasVisibilityCollapse($el)
}

export function elHasVisibilityHidden ($el) {
  return $el.css('visibility') === 'hidden'
}

export function elHasVisibilityCollapse ($el) {
  return $el.css('visibility') === 'collapse'
}

export function elHasOverflowHidden ($el) {
  const cssOverflow = [$el.css('overflow'), $el.css('overflow-y'), $el.css('overflow-x')]

  return cssOverflow.includes('hidden')
}

function elHasPositionRelative ($el: JQuery<HTMLElement>) {
  return $el.css('position') === 'relative'
}

function elHasPositionStatic ($el: JQuery<HTMLElement>) {
  return $el.css('position') == null || $el.css('position') === 'static'
}

function elHasPositionAbsolute ($el: JQuery<HTMLElement>) {
  return $el.css('position') === 'absolute'
}

function elHasClippableOverflow ($el) {
  return OVERFLOW_PROPS.includes($el.css('overflow')) ||
          OVERFLOW_PROPS.includes($el.css('overflow-y')) ||
            OVERFLOW_PROPS.includes($el.css('overflow-x'))
}

function elDescendentsHavePositionFixedOrAbsolute ($parent, $child) {
  // create an array of all elements between $parent and $child
  // including child but excluding parent
  // and check if these have position fixed|absolute
  const parents = getAllParents($child[0], $parent)
  const $els = $jquery.wrap(parents).add($child)

  return _.some($els.get(), (el) => {
    return /(fixed|absolute)/.test($jquery.wrap(el).css('position'))
  })
}

function elHasVisibleChild ($el) {
  return _.some($el.children(), (el) => {
    return isVisible(el)
  })
}

export function elHasNoEffectiveWidthOrHeight ($el: JQuery) {
  // Is the element's CSS width OR height, including any borders,
  // padding, and vertical scrollbars (if rendered) less than 0?
  //
  // elClientWidth:
  // If the element is hidden (for example, by setting style.display
  // on the element or one of its ancestors to "none"), then 0 is returned.

  // $el[0].getClientRects().length:
  // For HTML <area> elements, SVG elements that do not render anything themselves,
  // display:none elements, and generally any elements that are not directly rendered,
  // an empty list is returned.
  const el = $el[0]

  const style = getComputedStyle(el)
  let transform = style.getPropertyValue('transform')

  if (!transform.length) {
    transform = 'none'
  }

  const hasTextContent = !!el.textContent?.trim().length

  const width = elClientWidth($el)
  const height = elClientHeight($el)

  return (isZeroLengthAndTransformNone(width, height, transform) && !hasTextContent) ||
  isZeroLengthAndOverflowHidden(width, height, elHasOverflowHidden($el)) ||
  (el.getClientRects().length <= 0)
}

function isZeroLengthAndTransformNone (width, height, transform) {
  // From https://github.com/cypress-io/cypress/issues/5974,
  // we learned that when an element has non-'none' transform style value like "translate(0, 0)",
  // it is visible even with `height: 0` or `width: 0`.
  // That's why we're checking `transform === 'none'` together with elClientWidth/Height.
  return (width <= 0 && transform === 'none') || (height <= 0 && transform === 'none')
}

function isZeroLengthAndOverflowHidden (width, height, overflowHidden) {
  return (width <= 0 && overflowHidden) || (height <= 0 && overflowHidden)
}

function elementBoundingRect ($el: JQuery) {
  return $el[0].getBoundingClientRect()
}

export function elClientHeight ($el) {
  return elementBoundingRect($el).height
}

export function elClientWidth ($el) {
  return elementBoundingRect($el).width
}

function canClipContent ($el: JQuery<HTMLElement>, $ancestor: JQuery<HTMLElement>) {
  // can't clip without overflow properties
  if (!elHasClippableOverflow($ancestor)) {
    return false
  }

  if (elHasDisplayContents($ancestor)) {
    return false
  }

  // the closest parent with position relative, absolute, or fixed
  const $offsetParent = $el.offsetParent()

  // even if ancestors' overflow is clippable, if the element's offset parent
  // is a parent of the ancestor, the ancestor will not clip the element
  // unless the element is position relative
  if (!elHasPositionRelative($el) && isAncestor($ancestor, $offsetParent)) {
    return false
  }

  // even if ancestors' overflow is clippable, if the element's offset parent
  // is a child of the ancestor, the ancestor will not clip the element
  // unless the ancestor has a position that is not absolute
  if (elHasPositionAbsolute($offsetParent) && isChild($ancestor, $offsetParent)) {
    return false
  }

  // even if ancestors' overflow is clippable,
  // if the element is position static or relative,
  // and the element's offset parent is positioned absolute, a descendent of the ancestor, has no clippable overflow, and
  // the offsetParent's offset parent is not descendent of the ancestor,
  // then the ancestor will not clip the element
  const $offsetParentOffsetParent = $offsetParent.offsetParent()

  if ((elHasPositionStatic($el) || elHasPositionRelative($el))
    && elHasPositionAbsolute($offsetParent) && isDescendent($ancestor, $offsetParent)
    && !elHasClippableOverflow($offsetParent) && !isDescendent($ancestor, $offsetParentOffsetParent)
  ) {
    return false
  }

  return true
}

export const isW3CRendered = (el) => {
  // @see https://html.spec.whatwg.org/multipage/rendering.html#being-rendered
  return !(parentHasDisplayNone(wrap(el)) || wrap(el).css('visibility') === 'hidden')
}

export const isW3CFocusable = (el) => {
  // @see https://html.spec.whatwg.org/multipage/interaction.html#focusable-area
  return isFocusable(wrap(el)) && isW3CRendered(el)
}

export function parentHasDisplayNone ($el) {
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
  return parentHasDisplayNone(getParent($el))
}
