$window = require("./window")

getElementAtPointFromViewport = (doc, left, top) ->
  doc.elementFromPoint(left, top)

getElementPositioning = ($el) ->
  el = $el[0]

  win = $window.getWindowByElement(el)

  ## properties except for width / height
  ## are relative to the top left of the viewport
  rect = el.getBoundingClientRect()

  return {
    scrollTop: el.scrollTop
    scrollLeft: el.scrollLeft
    width: rect.width
    height: rect.height
    fromViewport: {
      top: rect.top
      left: rect.left
      right: rect.right
      bottom: rect.bottom
    }
    fromWindow: {
      top: rect.top + win.pageYOffset
      left: rect.left + win.pageXOffset
    }
  }

normalizeCoords = (left, top, xPosition = "center", yPosition = "center") ->
  left = switch xPosition
    when "left"   then Math.ceil(left)
    when "center" then Math.floor(left)
    when "right"  then Math.floor(left) - 1

  top = switch yPosition
    when "top"    then Math.ceil(top)
    when "center" then Math.floor(top)
    when "bottom" then Math.floor(top) - 1

  return { top, left }

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

getElementCoordinatesByPositionRelativeToXY = ($el, x, y) ->
  positionProps = getElementPositioning($el)

  { fromViewport, fromWindow } = positionProps

  fromViewport.left += x
  fromViewport.top += y

  fromWindow.left += x
  fromWindow.top += y

  normalizeFromViewport = normalizeCoords(fromViewport.left, fromViewport.top)
  normalizeFromWindow = normalizeCoords(fromWindow.left, fromWindow.top)

  fromViewport.left = normalizeFromViewport.left
  fromViewport.top = normalizeFromViewport.top

  fromWindow.left = normalizeFromWindow.left
  fromWindow.top = normalizeFromWindow.top

  return positionProps

getElementCoordinatesByPosition = ($el, position = "center") ->
  positionProps = getElementPositioning($el)

  ## get the coordinates from the window
  ## but also from the viewport so
  ## whoever is calling us can use it
  ## however they'd like
  { width, height, fromViewport, fromWindow } = positionProps

  ## dynamically call the function by transforming the name
  ## bottom -> getBottomCoordinates
  ## topLeft -> getTopLeftCoordinates
  capitalizedPosition = position.charAt(0).toUpperCase() + position.slice(1)

  fnName = "get" + capitalizedPosition + "Coordinates"

  fn = calculations[fnName]

  ## return an object with both sets
  ## of normalized coordinates for both
  ## the window and the viewport
  return {
    fromViewport: fn({
      width
      height
      top: fromViewport.top
      left: fromViewport.left
    }),
    fromWindow: fn({
      width
      height
      top: fromWindow.top
      left: fromWindow.left
    })
  }

calculations = {
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

module.exports = {
  normalizeCoords

  getElementPositioning

  getElementAtPointFromViewport

  getElementCoordinatesByPosition

  getElementCoordinatesByPositionRelativeToXY
}
