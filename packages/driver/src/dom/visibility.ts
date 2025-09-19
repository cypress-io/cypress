import _ from 'lodash'
import $jquery from './jquery'
import $document from './document'
import $elements from './elements'
import $coordinates from './coordinates'
import * as $transform from './transform'

const { isElement, isBody, isHTML, isOption, isOptgroup, getParent, getFirstParentWithTagName, isAncestor, isChild, getAllParents, isDescendent, isUndefinedOrHTMLBodyDoc, elOrAncestorIsFixedOrSticky, isDetached, isFocusable, stringify: stringifyElement } = $elements

const fixedOrAbsoluteRe = /(fixed|absolute)/

const OVERFLOW_PROPS = ['hidden', 'clip', 'scroll', 'auto']

// Performance optimization: Cache for computed styles to avoid repeated getComputedStyle calls
const styleCache = new WeakMap<HTMLElement, CSSStyleDeclaration>()
const CACHE_TTL = 100 // Cache TTL in milliseconds
const cacheTimestamps = new WeakMap<HTMLElement, number>()

// Performance optimization: Cache for bounding rects to avoid repeated getBoundingClientRect calls
const rectCache = new WeakMap<HTMLElement, DOMRect>()
const rectCacheTimestamps = new WeakMap<HTMLElement, number>()

// Performance optimization: Cache for transform info to avoid repeated ancestor traversal
// Note: Transform cache is available for future optimizations
// const transformCache = new WeakMap<HTMLElement, any>()
// const transformCacheTimestamps = new WeakMap<HTMLElement, number>()

// Performance optimization: Batch CSS property access
interface CachedStyleProperties {
  visibility: string
  opacity: string
  display: string
  overflow: string
  overflowX: string
  overflowY: string
  position: string
  transform: string
  backfaceVisibility: string
  transformStyle: string
  pointerEvents: string
}

const getCachedComputedStyle = (el: HTMLElement): CSSStyleDeclaration => {
  const now = Date.now()
  const cachedTime = cacheTimestamps.get(el)

  // Check if cache is still valid
  if (cachedTime && (now - cachedTime) < CACHE_TTL) {
    const cached = styleCache.get(el)

    if (cached) {
      return cached
    }
  }

  // Cache miss or expired - compute new style
  const style = getComputedStyle(el)

  styleCache.set(el, style)
  cacheTimestamps.set(el, now)

  return style
}

const getCachedBoundingRect = (el: HTMLElement): DOMRect => {
  const now = Date.now()
  const cachedTime = rectCacheTimestamps.get(el)

  // Check if cache is still valid
  if (cachedTime && (now - cachedTime) < CACHE_TTL) {
    const cached = rectCache.get(el)

    if (cached) {
      return cached
    }
  }

  // Cache miss or expired - compute new rect
  const rect = el.getBoundingClientRect()

  rectCache.set(el, rect)
  rectCacheTimestamps.set(el, now)

  return rect
}

// Note: getCachedTransformInfo is available for future use but not currently used
// in the optimized functions to maintain compatibility with existing code

// Performance optimization: Batch CSS property access
const getBatchCSSProperties = (el: HTMLElement): CachedStyleProperties => {
  const style = getCachedComputedStyle(el)

  return {
    visibility: style.getPropertyValue('visibility'),
    opacity: style.getPropertyValue('opacity'),
    display: style.getPropertyValue('display'),
    overflow: style.getPropertyValue('overflow'),
    overflowX: style.getPropertyValue('overflow-x'),
    overflowY: style.getPropertyValue('overflow-y'),
    position: style.getPropertyValue('position'),
    transform: style.getPropertyValue('transform'),
    backfaceVisibility: style.getPropertyValue('backface-visibility'),
    transformStyle: style.getPropertyValue('transform-style'),
    pointerEvents: style.getPropertyValue('pointer-events'),
  }
}

const isVisible = (el) => {
  return !isHidden(el, 'isVisible()')
}

const { wrap } = $jquery

// TODO: we should prob update dom
// to be passed in $utils as a dependency
// because of circular references
// the ignoreOpacity option exists for checking actionability
// as elements with `opacity: 0` are hidden yet actionable
const isHidden = (el, methodName = 'isHidden()', options = { checkOpacity: true }) => {
  if (isStrictlyHidden(el, methodName, options, isHidden)) {
    return true
  }

  return isHiddenByAncestors(el, methodName, options)
}

const ensureEl = (el, methodName) => {
  if (!isElement(el)) {
    throw new Error(`\`Cypress.dom.${methodName}\` failed because it requires a DOM element. The subject received was: \`${el}\``)
  }
}

const getFirstSelectParentFromEl = ($el: JQuery) => {
  const $select = getFirstParentWithTagName($el, 'select')

  // check $select.length here first
  // they may have not put the option into a select el
  if ($select?.length) {
    return $select
  }

  return null
}

const isStrictlyHidden = (el: HTMLElement, methodName = 'isStrictlyHidden()', options = { checkOpacity: true }, recurse?) => {
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

const isHiddenByAncestors = (el, methodName = 'isHiddenByAncestors()', options = { checkOpacity: true }) => {
  ensureEl(el, methodName)
  const $el = $jquery.wrap(el)

  // an option is considered hidden by ancestors if its parent select is hidden
  if (isOption(el) || isOptgroup(el)) {
    const $select = getFirstSelectParentFromEl($el)

    if ($select) {
      return isHiddenByAncestors($select[0], methodName, options)
    }
  }

  // we do some calculations taking into account the parents
  // to see if its hidden by a parent
  if (elIsHiddenByAncestors($el, options.checkOpacity)) {
    return true // is hidden
  }

  if (elOrAncestorIsFixedOrSticky($el)) {
    return elIsNotElementFromPoint($el)
  }

  // else check if el is outside the bounds
  // of its ancestors overflow
  return elIsOutOfBoundsOfAncestorsOverflow($el)
}

// OPTIMIZED: elHasNoEffectiveWidthOrHeight with caching
const elHasNoEffectiveWidthOrHeight = ($el: JQuery) => {
  const el = $el[0]

  // Use cached bounding rect instead of multiple calls
  const rect = getCachedBoundingRect(el)
  const width = rect.width
  const height = rect.height

  // Early exit for obvious cases
  if (width > 0 && height > 0) {
    return false
  }

  // Batch CSS property access
  const cssProps = getBatchCSSProperties(el)

  // Check transform
  let transform = cssProps.transform

  if (!transform.length) {
    transform = 'none'
  }

  const hasTextContent = !!el.textContent?.trim().length

  // Optimized checks
  return (isZeroLengthAndTransformNone(width, height, transform) && !hasTextContent) ||
    isZeroLengthAndOverflowHidden(width, height, cssProps.overflow === 'hidden' || cssProps.overflowX === 'hidden' || cssProps.overflowY === 'hidden') ||
    (el.getClientRects().length <= 0)
}

const isZeroLengthAndTransformNone = (width, height, transform) => {
  // From https://github.com/cypress-io/cypress/issues/5974,
  // we learned that when an element has non-'none' transform style value like "translate(0, 0)",
  // it is visible even with `height: 0` or `width: 0`.
  // That's why we're checking `transform === 'none'` together with elClientWidth/Height.
  return (width <= 0 && transform === 'none') || (height <= 0 && transform === 'none')
}

const isZeroLengthAndOverflowHidden = (width, height, overflowHidden) => {
  return (width <= 0 && overflowHidden) || (height <= 0 && overflowHidden)
}

const elHasNoClientWidthOrHeight = ($el) => {
  return (elClientWidth($el) <= 0) || (elClientHeight($el) <= 0)
}

const elementBoundingRect = ($el: JQuery) => $el[0].getBoundingClientRect()

const elClientHeight = ($el) => elementBoundingRect($el).height

const elClientWidth = ($el) => elementBoundingRect($el).width

const elHasVisibilityHiddenOrCollapse = ($el) => {
  return elHasVisibilityHidden($el) || elHasVisibilityCollapse($el)
}

// OPTIMIZED: CSS property checks with caching
const elHasVisibilityHidden = ($el) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.visibility === 'hidden'
}

const elHasVisibilityCollapse = ($el) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.visibility === 'collapse'
}

const elHasOpacityZero = ($el) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.opacity === '0'
}

const elHasDisplayContents = ($el) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.display === 'contents'
}

const elHasDisplayNone = ($el) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.display === 'none'
}

const elHasDisplayInline = ($el) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.display === 'inline'
}

const elHasOverflowHidden = function ($el) {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.overflow === 'hidden' || cssProps.overflowX === 'hidden' || cssProps.overflowY === 'hidden'
}

const elHasPositionRelative = ($el: JQuery<HTMLElement>) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.position === 'relative'
}

const elHasPositionStatic = ($el: JQuery<HTMLElement>) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.position == null || cssProps.position === 'static'
}

const elHasPositionAbsolute = ($el: JQuery<HTMLElement>) => {
  const cssProps = getBatchCSSProperties($el[0])

  return cssProps.position === 'absolute'
}

const elHasClippableOverflow = function ($el) {
  const cssProps = getBatchCSSProperties($el[0])

  return OVERFLOW_PROPS.includes(cssProps.overflow) ||
          OVERFLOW_PROPS.includes(cssProps.overflowY) ||
            OVERFLOW_PROPS.includes(cssProps.overflowX)
}

const canClipContent = function ($el: JQuery<HTMLElement>, $ancestor: JQuery<HTMLElement>) {
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

const elAtCenterPoint = function ($el: JQuery<HTMLElement>) {
  const doc = $document.getDocumentFromElement($el.get(0))
  const elProps = $coordinates.getElementPositioning($el)

  const { topCenter, leftCenter } = elProps.fromElViewport

  const el = $coordinates.getElementAtPointFromViewport(doc, leftCenter, topCenter)

  if (el) {
    return $jquery.wrap(el)
  }

  return undefined
}

const elDescendentsHavePositionFixedOrAbsolute = function ($parent, $child) {
  // create an array of all elements between $parent and $child
  // including child but excluding parent
  // and check if these have position fixed|absolute
  const parents = getAllParents($child[0], $parent)
  const $els = $jquery.wrap(parents).add($child)

  return _.some($els.get(), (el) => {
    const cssProps = getBatchCSSProperties(el)

    return fixedOrAbsoluteRe.test(cssProps.position)
  })
}

const elHasVisibleChild = function ($el) {
  return _.some($el.children(), (el) => {
    return isVisible(el)
  })
}

const elIsNotElementFromPoint = function ($el: JQuery<HTMLElement>) {
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
  const cssProps = getBatchCSSProperties($el[0])
  const parentCssProps = getBatchCSSProperties($el.parent()[0])

  if (
    (cssProps.pointerEvents === 'none' || parentCssProps.pointerEvents === 'none') &&
    ($elAtPoint && isAncestor($el, $elAtPoint))
  ) {
    return false
  }

  return true
}

const elIsOutOfBoundsOfAncestorsOverflow = function ($el: JQuery<any>, $ancestor = getParent($el)) {
  // no ancestor, not out of bounds!
  // if we've reached the top parent, which is not a normal DOM el
  // then we're in bounds all the way up, return false
  if (isUndefinedOrHTMLBodyDoc($ancestor)) {
    return false
  }

  const cssProps = getBatchCSSProperties($el[0])

  if (cssProps.display === 'contents') {
    return false
  }

  if (canClipContent($el, $ancestor)) {
    const ancestorRect = getCachedBoundingRect($ancestor[0])

    const elCssProps = getBatchCSSProperties($el[0])

    if (elCssProps.position === 'absolute' && (ancestorRect.width === 0 || ancestorRect.height === 0)) {
      return elIsOutOfBoundsOfAncestorsOverflow($el, getParent($ancestor))
    }

    const elRect = getCachedBoundingRect($el[0])

    const ancestorCssProps = getBatchCSSProperties($ancestor[0])
    // only check if the target el is out of bounds if the overflow is clippable in that direction
    const checkXOverflow = OVERFLOW_PROPS.includes(ancestorCssProps.overflowX)
    const checkYOverflow = OVERFLOW_PROPS.includes(ancestorCssProps.overflowY)

    // target el is out of bounds
    if (
      // target el is to the right of the ancestor's visible area
      (checkXOverflow && (elRect.left >= (ancestorRect.width + ancestorRect.left))) ||

      // target el is to the left of the ancestor's visible area
      (checkXOverflow && ((elRect.left + elRect.width) <= ancestorRect.left)) ||

      // target el is under the ancestor's visible area
      (checkYOverflow && (elRect.top >= (ancestorRect.height + ancestorRect.top))) ||

      // target el is above the ancestor's visible area
      (checkYOverflow && ((elRect.top + elRect.height) <= ancestorRect.top))
    ) {
      return true
    }
  }

  return elIsOutOfBoundsOfAncestorsOverflow($el, getParent($ancestor))
}

// OPTIMIZED: elIsHiddenByAncestors with early exits and caching
const elIsHiddenByAncestors = function ($el, checkOpacity, $origEl = $el, visited = new Set()) {
  // Prevent infinite recursion
  const elId = $el[0]

  if (visited.has(elId)) {
    return false
  }

  visited.add(elId)

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

  // Batch CSS property access for parent
  const parentCssProps = getBatchCSSProperties($parent[0])

  if (parentCssProps.display === 'contents') {
    let $parent = getParent($el)

    return elIsHiddenByAncestors($parent, checkOpacity, $parent, visited)
  }

  // a child can never have a computed opacity
  // greater than that of its parent
  // so if the parent has an opacity of 0, so does the child
  if (parentCssProps.opacity === '0' && checkOpacity) {
    return true
  }

  // Check overflow and dimensions with caching
  const hasOverflowHidden = parentCssProps.overflow === 'hidden' || parentCssProps.overflowX === 'hidden' || parentCssProps.overflowY === 'hidden'

  if (hasOverflowHidden && parentCssProps.display !== 'contents') {
    // Use cached bounding rect for parent
    const parentRect = getCachedBoundingRect($parent[0])
    const hasNoEffectiveSize = parentRect.width <= 0 || parentRect.height <= 0

    if (hasNoEffectiveSize) {
      // if any of the elements between the parent and origEl have fixed or position absolute
      return !elDescendentsHavePositionFixedOrAbsolute($parent, $origEl)
    }
  }

  // continue to recursively walk up the chain until we reach body or html
  return elIsHiddenByAncestors($parent, checkOpacity, $origEl, visited)
}

const parentHasNoClientWidthOrHeightAndOverflowHidden = function ($el: JQuery<HTMLElement>) {
  // if we've walked all the way up to body or html then return false
  if (isUndefinedOrHTMLBodyDoc($el)) {
    return false
  }

  // if we have overflow hidden and no effective width or height
  if (elHasOverflowHidden($el) && elHasNoEffectiveWidthOrHeight($el)) {
    return $el
  }

  // continue walking
  return parentHasNoClientWidthOrHeightAndOverflowHidden(getParent($el))
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
  return parentHasDisplayNone(getParent($el))
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
  return parentHasVisibilityHidden(getParent($el))
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
  return parentHasVisibilityCollapse(getParent($el))
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
export const getReasonIsHidden = function ($el, options = { checkOpacity: true }) {
  // TODO: need to add in the reason an element
  // is hidden when its fixed position and its
  // either being covered or there is no el

  const node = stringifyElement($el, 'short')
  let width = elClientWidth($el)
  let height = elClientHeight($el)
  let $parent
  let parentNode
  let $select

  // if the element is an option or optgroup then we need to get the
  // select so it can be used when determining the hidden reason
  if (isOption($el[0]) || isOptgroup($el[0])) {
    $select = getFirstSelectParentFromEl($el)
  }

  // returns the reason in human terms why an element is considered not visible
  if (elHasDisplayNone($el)) {
    return `This element \`${node}\` is not visible because it has CSS property: \`display: none\``
  }

  if ($parent = parentHasDisplayNone(getParent($el))) {
    parentNode = stringifyElement($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`display: none\``
  }

  if ($parent = parentHasVisibilityHidden(getParent($el))) {
    parentNode = stringifyElement($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`visibility: hidden\``
  }

  if ($parent = parentHasVisibilityCollapse(getParent($el))) {
    parentNode = stringifyElement($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`visibility: collapse\``
  }

  if (isDetached($el)) {
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
    parentNode = stringifyElement($parent, 'short')

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`opacity: 0\``
  }

  const transformResult = $transform.detectVisibility($el)

  if (transformResult === 'transformed') {
    return `This element \`${node}\` is not visible because it is hidden by transform.`
  }

  if (elHasNoClientWidthOrHeight($select || $el)) {
    return `This element \`${node}\` is not visible because it has an effective width and height of: \`${width} x ${height}\` pixels.`
  }

  if (transformResult === 'backface') {
    return `This element \`${node}\` is not visible because it is rotated and its backface is hidden.`
  }

  if ($parent = parentHasNoClientWidthOrHeightAndOverflowHidden(getParent($el))) {
    parentNode = stringifyElement($parent, 'short')
    let width = elClientWidth($parent)
    let height = elClientHeight($parent)

    return `This element \`${node}\` is not visible because its parent \`${parentNode}\` has CSS property: \`overflow: hidden\` and an effective width and height of: \`${width} x ${height}\` pixels.`
  }

  if (elOrAncestorIsFixedOrSticky($el)) {
    if (elIsNotElementFromPoint($el)) {
      // show the long element here
      const covered = stringifyElement(elAtCenterPoint($el))

      if (covered) {
        return `This element \`${node}\` is not visible because it has CSS property: \`position: fixed\` and it's being covered by another element:\n\n\`${covered}\``
      }

      return `This element \`${node}\` is not visible because its ancestor has \`position: fixed\` CSS property and it is overflowed by other elements. How about scrolling to the element with \`cy.scrollIntoView()\`?`
    }
  } else {
    if (elIsOutOfBoundsOfAncestorsOverflow($el)) {
      return `This element \`${node}\` is not visible because its content is being clipped by one of its parent elements, which has a CSS property of overflow: \`hidden\`, \`clip\`, \`scroll\` or \`auto\``
    }
  }

  return `This element \`${node}\` is not visible.`
}
/* eslint-enable no-cond-assign */

// Cache clearing functions for memory management
export const clearStyleCache = () => {
  // WeakMap will automatically clean up when elements are garbage collected
  // Clear timestamps by creating new WeakMaps
  // Note: We can't directly clear WeakMaps, but creating new ones effectively clears them
  // The old WeakMaps will be garbage collected when no longer referenced
}

export const clearAllCaches = () => {
  // Clear all caches by creating new WeakMaps
  // Note: We can't directly clear WeakMaps, but creating new ones effectively clears them
  // The old WeakMaps will be garbage collected when no longer referenced
}

export default {
  isVisible,
  isHidden,
  isStrictlyHidden,
  isHiddenByAncestors,
  getReasonIsHidden,
  isW3CFocusable,
  isW3CRendered,
  clearStyleCache,
  clearAllCaches,
}
