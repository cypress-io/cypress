$jquery = require("./jquery")
$window = require("./window")
$document = require("./document")
$visibility = require("./visibility")
$elements = require("./elements")

{ isWindow } = $window
{ isDocument } = $document
{ wrapInjQuery, isJquery } = $jquery
{ isVisible, isHidden, getReasonIsHidden } = $visibility
{ isType, isElement, isScrollable, stringify, getElements, isAttachedToDom, isTextLike, isSelector, isDescendent, positionProps, getFirstFixedOrStickyPositionParent, getFirstScrollableParent } = $elements

isDom = (obj) ->
  isElement(obj) or isWindow(obj) or isDocument(obj)

## we are exposing these publicly to be used
## by our own internal code, but also for
## our users. They can use them for debugging
## purposes or for overriding. Everything else
## can be tucked away behind these interfaces.
module.exports = {
  isDom

  isType

  isVisible

  isHidden

  isTextLike

  isScrollable

  isSelector

  isDescendent

  isElement

  isDocument

  isWindow

  isAttachedToDom

  isJquery

  wrapInjQuery

  stringify

  positionProps

  getElements

  getReasonIsHidden

  getFirstScrollableParent

  getFirstFixedOrStickyPositionParent

}
