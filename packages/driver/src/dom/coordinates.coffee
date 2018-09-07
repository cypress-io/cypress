$window = require("./window")

getElementAtPointFromViewport = (doc, x, y) ->
  doc.elementFromPoint(x, y)

getElementPositioning = ($el) ->
  el = $el[0]

  win = $window.getWindowByElement(el)

  ## properties except for width / height
  ## are relative to the top left of the viewport
  rect = el.getBoundingClientRect()

  center = getCenterCoordinates(rect)

  ## add the center coordinates
  ## because its useful to any caller
  topCenter = center.y
  leftCenter = center.x

  ## factor in elements within iframes
  iframe = cy.state("$autIframe").get(0).getBoundingClientRect()

  return {
    scrollTop: el.scrollTop
    scrollLeft: el.scrollLeft
    width: rect.width
    height: rect.height
    fromTopViewport: {
      top: rect.top + iframe.top
      left: rect.left + iframe.left
      right: rect.right + iframe.right
      bottom: rect.bottom + iframe.bottom
      topCenter: topCenter + iframe.top
      leftCenter: leftCenter + iframe.left
    }
    fromViewport: {
      top: rect.top
      left: rect.left
      right: rect.right
      bottom: rect.bottom
      topCenter
      leftCenter
    }
    fromWindow: {
      top: rect.top + win.pageYOffset
      left: rect.left + win.pageXOffset
      topCenter: topCenter + win.pageYOffset
      leftCenter: leftCenter + win.pageXOffset
    }
  }

getCoordsByPosition = (left, top, xPosition = "center", yPosition = "center") ->
  left = switch xPosition
    when "left"   then Math.ceil(left)
    when "center" then Math.floor(left)
    when "right"  then Math.floor(left) - 1

  top = switch yPosition
    when "top"    then Math.ceil(top)
    when "center" then Math.floor(top)
    when "bottom" then Math.floor(top) - 1

  ## returning x/y here because this is
  ## about the target position we want
  ## to fire the event at based on what
  ## the desired xPosition and yPosition is
  return {
    x: left
    y: top
  }

getTopLeftCoordinates = (rect) ->
  x = rect.left
  y = rect.top
  getCoordsByPosition(x, y, "left", "top")

getTopCoordinates = (rect) ->
  x = rect.left + rect.width / 2
  y = rect.top
  getCoordsByPosition(x, y, "center", "top")

getTopRightCoordinates = (rect) ->
  x = rect.left + rect.width
  y = rect.top
  getCoordsByPosition(x, y, "right", "top")

getLeftCoordinates = (rect) ->
  x = rect.left
  y = rect.top + rect.height / 2
  getCoordsByPosition(x, y, "left", "center")

getCenterCoordinates = (rect) ->
  x = rect.left + rect.width / 2
  y = rect.top + rect.height / 2
  getCoordsByPosition(x, y, "center", "center")

getRightCoordinates = (rect) ->
  x = rect.left + rect.width
  y = rect.top + rect.height / 2
  getCoordsByPosition(x, y, "right", "center")

getBottomLeftCoordinates = (rect) ->
  x = rect.left
  y = rect.top + rect.height
  getCoordsByPosition(x, y, "left", "bottom")

getBottomCoordinates = (rect) ->
  x = rect.left + rect.width / 2
  y = rect.top + rect.height
  getCoordsByPosition(x, y, "center", "bottom")

getBottomRightCoordinates = (rect) ->
  x = rect.left + rect.width
  y = rect.top + rect.height
  getCoordsByPosition(x, y, "right", "bottom")

getElementCoordinatesByPositionRelativeToXY = ($el, x, y) ->
  positionProps = getElementPositioning($el)

  { fromViewport, fromWindow } = positionProps

  fromViewport.left += x
  fromViewport.top += y

  fromWindow.left += x
  fromWindow.top += y

  viewportTargetCoords = getTopLeftCoordinates(fromViewport)
  windowTargetCoords = getTopLeftCoordinates(fromWindow)

  fromViewport.x = viewportTargetCoords.x
  fromViewport.y = viewportTargetCoords.y

  fromWindow.x = windowTargetCoords.x
  fromWindow.y = windowTargetCoords.y

  return positionProps

getElementCoordinatesByPosition = ($el, position = "center") ->
  positionProps = getElementPositioning($el)

  ## get the coordinates from the window
  ## but also from the viewport so
  ## whoever is calling us can use it
  ## however they'd like
  { width, height, fromViewport, fromWindow, fromTopViewport } = positionProps

  ## dynamically call the function by transforming the name
  ## bottom -> getBottomCoordinates
  ## topLeft -> getTopLeftCoordinates
  capitalizedPosition = position.charAt(0).toUpperCase() + position.slice(1)

  fnName = "get" + capitalizedPosition + "Coordinates"

  fn = calculations[fnName]

  ## get the desired x/y coords based on
  ## what position we're trying to target
  viewportTargetCoords = fn({
    width
    height
    top: fromViewport.top
    left: fromViewport.left
  })

  ## get the desired x/y coords based on
  ## what position we're trying to target
  windowTargetCoords = fn({
    width
    height
    top: fromWindow.top
    left: fromWindow.left
  })

  ## HACK: fix this plz
  fromTopViewport.x = viewportTargetCoords.x + fromTopViewport.left
  fromTopViewport.y = viewportTargetCoords.y + fromTopViewport.top

  fromViewport.x = viewportTargetCoords.x
  fromViewport.y = viewportTargetCoords.y

  fromWindow.x = windowTargetCoords.x
  fromWindow.y = windowTargetCoords.y

  ## return an object with both sets
  ## of normalized coordinates for both
  ## the window and the viewport
  return {
    width
    height
    fromTopViewport
    fromViewport
    fromWindow
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
  getCoordsByPosition

  getElementPositioning

  getElementAtPointFromViewport

  getElementCoordinatesByPosition

  getElementCoordinatesByPositionRelativeToXY
}
