_ = require("lodash")
$ = require("jquery")

#                   ** CEIL **
#                   top: if y coord is 100.75,
#                   click at 101 to be in rect
# ** CEIL **        --------------------------  ** FLOOR **
# left: if x coord  |                        |  right: if x coord
# is 100.75,        |                        |  is 200.75,
# click at 101      |                        |  click at (200 - 1)
# to be in rect     |                        |  to be in rect
#                   --------------------------
#                   ** FLOOR **
#                   bottom: if y coord is 200.75,
#                   click at (200 - 1) to be in rect

normalizeCoords = (x, y, xPosition = "center", yPosition = "center") ->
  coords = {}

  switch xPosition
    when "left"   then coords.x = Math.ceil(x)
    when "center" then coords.x = Math.floor(x)
    when "right"  then coords.x = Math.floor(x) - 1

  switch yPosition
    when "top"    then coords.y = Math.ceil(y)
    when "center" then coords.y = Math.floor(y)
    when "bottom" then coords.y = Math.floor(y) - 1

  coords

getBoundingClientRect = ($el, state) ->
  ## getBoundingClientRect ensures rotatation
  ## is factored into calculations
  ## which means we dont have to do any math, yay!
  if Element.prototype.getBoundingClientRect
    win = state("window")

    ## top/left are returned relative to viewport
    ## so we have to add in the scrolled amount
    ## to get absolute coordinates
    offset = $el.get(0).getBoundingClientRect()

    ## we have to convert to a regular object to mutate
    offset = _.pick(offset, "top", "left", "width", "height")
    offset.top  += win.pageYOffset
    offset.left += win.pageXOffset

    {width, height} = offset
  else
    offset = $el.offset()
    width  = $el.outerWidth()
    height = $el.outerHeight()

getTopLeftCoordinates = (rect) ->
  x = rect.left
  y = rect.top
  normalizeCoords(x, y, "left", "top")

getTopCoordinates = (rect) ->
  x = rect.left + rect.width / 2
  y = rect.top
  normalizeCoords(x, y, "center", "top")

getTopRightCoordinates = (rect) ->
  x = rect.left + rect.width
  y = rect.top
  normalizeCoords(x, y, "right", "top")

getLeftCoordinates = (rect) ->
  x = rect.left
  y = rect.top + rect.height / 2
  normalizeCoords(x, y, "left", "center")

getCenterCoordinates = (rect) ->
  x = rect.left + rect.width / 2
  y = rect.top + rect.height / 2
  normalizeCoords(x, y, "center", "center")

getRightCoordinates = (rect) ->
  x = rect.left + rect.width
  y = rect.top + rect.height / 2
  normalizeCoords(x, y, "right", "center")

getBottomLeftCoordinates = (rect) ->
  x = rect.left
  y = rect.top + rect.height
  normalizeCoords(x, y, "left", "bottom")

getBottomCoordinates = (rect) ->
  x = rect.left + rect.width / 2
  y = rect.top + rect.height
  normalizeCoords(x, y, "center", "bottom")

getBottomRightCoordinates = (rect) ->
  x = rect.left + rect.width
  y = rect.top + rect.height
  normalizeCoords(x, y, "right", "bottom")

getAbsoluteCoordinatesRelativeToXY = (state, $el, x, y) ->
  rect = getBoundingClientRect($el, state)
  x    = rect.left + x
  y    = rect.top + y
  normalizeCoords(x, y)

functions = {
  getTopCoordinates
  getTopLeftCoordinates
  getTopRightCoordinates
  getLeftCoordinates
  getCenterCoordinates
  getRightCoordinates
  getBottomLeftCoordinates
  getBottomCoordinates
  getBottomRightCoordinates
}

create = (state, ensureValidPosition) ->
  return {
    getAbsoluteCoordinatesRelativeToXY: ($el, x, y) ->
      getAbsoluteCoordinatesRelativeToXY(state, $el, x, y)

    getElementAtCoordinates: (x, y) ->
      ## the coords we receive are absolute coordinates from
      ## the top of the window, they are not relative to the viewport
      ## because elementFromPoint returns us elements only relative
      ## to the viewport, we must subtract the current scroll'd offset
      ## before applying this calculation
      ## however this method assumes the element in question IS currently
      ## in the viewport, and therefore we must ensure to scroll the
      ## element into view prior to running this method or this will
      ## return null
      win = state("window")

      scrollX = x - win.pageXOffset
      scrollY = y - win.pageYOffset

      el = state("document").elementFromPoint(scrollX, scrollY)

      ## only wrap el if its non-null
      if el
        el = $(el)

      return el

    getAbsoluteCoordinates: ($el, position = "center") ->
      ensureValidPosition(position)

      ## rect is an object literal looking like this...
      ## {top: 35, left: 60, width: 100, height: 90}
      rect = getBoundingClientRect($el, state)

      ## dynamically call the function by transforming the name
      ## bottom -> getBottomCoordinates
      ## topLeft -> getTopLeftCoordinates
      capitalizedPosition = position.charAt(0).toUpperCase() + position.slice(1)

      fnName = "get" + capitalizedPosition + "Coordinates"

      functions[fnName](rect)
  }

module.exports = {
  create
}
