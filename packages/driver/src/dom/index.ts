import $jquery from './jquery'
import $window from './window'
import $document from './document'
import $elements from './elements'
import $coordinates from './coordinates'
import $selection from './selection'
import $visibility from './visibility'
import $blackout from './blackout'
import $animation from './animation'

const { isWindow, getWindowByElement } = $window
const { isDocument, getDocumentFromElement } = $document
const { wrap, unwrap, isJquery, query } = $jquery
const { isVisible, isHidden, isStrictlyHidden, isHiddenByAncestors, getReasonIsHidden, isW3CRendered, isW3CFocusable } = $visibility
const { isInputType, isFocusable, isElement, isScrollable, isFocused, stringify, getElements, getContainsSelector, getFirstDeepestElement, getInputFromLabel, isDetached, isAttached, isTextLike, isSelector, isDescendent, getFirstFixedOrStickyPositionParent, getFirstStickyPositionParent, getFirstScrollableParent, isUndefinedOrHTMLBodyDoc, elementFromPoint, getParent, findAllShadowRoots, isWithinShadowRoot, getHostContenteditable } = $elements
const { getCoordsByPosition, getElementPositioning, getElementCoordinatesByPosition, getElementAtPointFromViewport, getElementCoordinatesByPositionRelativeToXY } = $coordinates
const { getSelectionBounds } = $selection
const { addBlackouts, removeBlackouts } = $blackout
const { removeCssAnimationDisabler, addCssAnimationDisabler } = $animation

const isDom = (obj) => {
  return isElement(obj) || isWindow(obj) || isDocument(obj)
}

// we are exposing these publicly to be used
// by our own internal code, but also for
// our users. They can use them for debugging
// purposes or for overriding. Everything else
// can be tucked away behind these interfaces.
export default {
  removeBlackouts,
  addBlackouts,
  removeCssAnimationDisabler,
  addCssAnimationDisabler,
  wrap,
  isW3CFocusable,
  isW3CRendered,
  query,
  unwrap,
  elementFromPoint,
  isDom,
  isInputType,
  isVisible,
  isHidden,
  isStrictlyHidden,
  isHiddenByAncestors,
  isFocusable,
  isTextLike,
  isScrollable,
  isFocused,
  isDetached,
  isAttached,
  isSelector,
  isDescendent,
  isUndefinedOrHTMLBodyDoc,
  isElement,
  isDocument,
  isWindow,
  isJquery,
  stringify,
  findAllShadowRoots,
  isWithinShadowRoot,
  getElements,
  getContainsSelector,
  getFirstDeepestElement,
  getWindowByElement,
  getReasonIsHidden,
  getFirstScrollableParent,
  getFirstFixedOrStickyPositionParent,
  getFirstStickyPositionParent,
  getCoordsByPosition,
  getElementPositioning,
  getElementAtPointFromViewport,
  getElementCoordinatesByPosition,
  getElementCoordinatesByPositionRelativeToXY,
  getHostContenteditable,
  getSelectionBounds,
  getDocumentFromElement,
  getParent,
  getInputFromLabel,
}
