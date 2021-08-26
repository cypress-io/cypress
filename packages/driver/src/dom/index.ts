import { isDocument } from './document'
import { isWindow } from './window'
import { isElement } from './elements'

export const isDom = (obj) => {
  return isElement(obj) || isWindow(obj) || isDocument(obj)
}

// we are exposing these publicly to be used
// by our own internal code, but also for
// our users. They can use them for debugging
// purposes or for overriding. Everything else
// can be tucked away behind these interfaces.
export { getHostContenteditable, getSelectionBounds } from './selection'

export { wrap, unwrap, isJquery, query } from './jquery'

export { isWindow, getWindowByElement } from './window'

export { isDocument, getDocumentFromElement } from './document'

export { isInputType, isFocusable, isElement, isScrollable, isFocused, stringify, getElements, getContainsSelector, getFirstDeepestElement, isDetached, isAttached, isTextLike, isSelector, isDescendent, getFirstFixedOrStickyPositionParent, getFirstStickyPositionParent, getFirstScrollableParent, isUndefinedOrHTMLBodyDoc, elementFromPoint, getParent, findAllShadowRoots, findShadowRoots, isWithinShadowRoot } from './elements'

export { isVisible, isHidden, getReasonIsHidden } from './visibility'

export { getCoordsByPosition, getElementPositioning, getElementCoordinatesByPosition, getElementAtPointFromViewport, getElementCoordinatesByPositionRelativeToXY } from './coordinates'
