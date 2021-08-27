import $jquery from './jquery'
import $window from './window'
import $document from './document'
import $elements from './elements'
import $coordinates from './coordinates'
import $selection from './selection'

const { isWindow, getWindowByElement } = $window
const { isDocument, getDocumentFromElement } = $document
const { wrap, unwrap, isJquery, query } = $jquery

const { getCoordsByPosition, getElementPositioning, getElementCoordinatesByPosition, getElementAtPointFromViewport, getElementCoordinatesByPositionRelativeToXY } = $coordinates
const { getHostContenteditable, getSelectionBounds } = $selection
const { isVisible, isHidden, getReasonIsHidden, isInputType, isFocusable, isElement, isScrollable, isFocused, stringify, getElements, getContainsSelector, getFirstDeepestElement, isDetached, isAttached, isTextLike, isSelector, isDescendent, getFirstFixedOrStickyPositionParent, getFirstStickyPositionParent, getFirstScrollableParent, isUndefinedOrHTMLBodyDoc, elementFromPoint, getParent, findAllShadowRoots, findShadowRoots, isWithinShadowRoot } = $elements

const isDom = (obj) => {
  return isElement(obj) || isWindow(obj) || isDocument(obj)
}

// we are exposing these publicly to be used
// by our own internal code, but also for
// our users. They can use them for debugging
// purposes or for overriding. Everything else
// can be tucked away behind these interfaces.
export default {
  wrap,
  query,
  unwrap,
  elementFromPoint,
  isDom,
  isInputType,
  isVisible,
  isHidden,
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
  findShadowRoots,
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
}
