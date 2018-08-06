$jquery = require("./jquery")
$window = require("./window")
$document = require("./document")
$elements = require("./elements")
$visibility = require("./visibility")
$coordinates = require("./coordinates")

{ isWindow, getWindowByElement } = $window
{ isDocument } = $document
{ wrap, unwrap, isJquery } = $jquery
{ isVisible, isHidden, getReasonIsHidden } = $visibility
{ isType, isFocusable, isElement, isScrollable, stringify, getElements, getContainsSelector, getFirstDeepestElement, isDetached, isAttached, isTextLike, isSelector, isDescendent,  getFirstFixedOrStickyPositionParent, getFirstStickyPositionParent,  getFirstScrollableParent } = $elements
{ getCoordsByPosition, getElementPositioning, getElementCoordinatesByPosition, getElementAtPointFromViewport, getElementCoordinatesByPositionRelativeToXY } = $coordinates

isDom = (obj) ->
  isElement(obj) or isWindow(obj) or isDocument(obj)

## we are exposing these publicly to be used
## by our own internal code, but also for
## our users. They can use them for debugging
## purposes or for overriding. Everything else
## can be tucked away behind these interfaces.
module.exports = {
  wrap

  unwrap

  isDom

  isType

  isVisible

  isHidden

  isFocusable

  isTextLike

  isScrollable

  isDetached

  isAttached

  isSelector

  isDescendent

  isElement

  isDocument

  isWindow

  isJquery

  stringify

  getElements

  getContainsSelector

  getFirstDeepestElement

  getWindowByElement

  getReasonIsHidden

  getFirstScrollableParent

  getFirstFixedOrStickyPositionParent

  getFirstStickyPositionParent

  getCoordsByPosition

  getElementPositioning

  getElementAtPointFromViewport

  getElementCoordinatesByPosition

  getElementCoordinatesByPositionRelativeToXY

}
