const $window = require('./window')

const getElementAtPointFromViewport = (doc, x, y) => {
  return doc.elementFromPoint(x, y)
}

const getElementPositioning = ($el) => {
  /**
   * @type {HTMLElement}
   */
  const el = $el[0]

  const win = $window.getWindowByElement(el)

  // properties except for width / height
  // are relative to the top left of the viewport

  // we use the first of getClientRects in order to account for inline elements
  // that span multiple lines. Which would cause us to click in the center and thus miss
  // This should be the same as using getBoundingClientRect()
  // for elements with a single rect
  // const rect = el.getBoundingClientRect()
  const rect = el.getClientRects()[0] || el.getBoundingClientRect()

  const center = getCenterCoordinates(rect)

  // add the center coordinates
  // because its useful to any caller
  const topCenter = center.y
  const leftCenter = center.x

  return {
    scrollTop: el.scrollTop,
    scrollLeft: el.scrollLeft,
    width: rect.width,
    height: rect.height,
    fromViewport: {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      topCenter,
      leftCenter,
    },
    fromWindow: {
      top: rect.top + win.pageYOffset,
      left: rect.left + win.pageXOffset,
      topCenter: topCenter + win.pageYOffset,
      leftCenter: leftCenter + win.pageXOffset,
    },
  }
}

const getCoordsByPosition = (left, top, xPosition = 'center', yPosition = 'center') => {
  const getLeft = () => {
    /* eslint-disable default-case */
    switch (xPosition) {
      case 'left': return Math.ceil(left)
      case 'center': return Math.floor(left)
      case 'right': return Math.floor(left) - 1
    }
  }

  const getTop = () => {
    switch (yPosition) {
      case 'top': return Math.ceil(top)
      case 'center': return Math.floor(top)
      case 'bottom': return Math.floor(top) - 1
    }
  }

  /* eslint-disable default-case */

  // returning x/y here because this is
  // about the target position we want
  // to fire the event at based on what
  // the desired xPosition and yPosition is
  return {
    x: getLeft(),
    y: getTop(),
  }
}

const getTopLeftCoordinates = (rect) => {
  const x = rect.left
  const y = rect.top

  return getCoordsByPosition(x, y, 'left', 'top')
}

const getTopCoordinates = (rect) => {
  const x = rect.left + (rect.width / 2)
  const y = rect.top

  return getCoordsByPosition(x, y, 'center', 'top')
}

const getTopRightCoordinates = (rect) => {
  const x = rect.left + rect.width
  const y = rect.top

  return getCoordsByPosition(x, y, 'right', 'top')
}

const getLeftCoordinates = (rect) => {
  const x = rect.left
  const y = rect.top + (rect.height / 2)

  return getCoordsByPosition(x, y, 'left', 'center')
}

const getCenterCoordinates = (rect) => {
  const x = rect.left + (rect.width / 2)
  const y = rect.top + (rect.height / 2)

  return getCoordsByPosition(x, y, 'center', 'center')
}

const getRightCoordinates = (rect) => {
  const x = rect.left + rect.width
  const y = rect.top + (rect.height / 2)

  return getCoordsByPosition(x, y, 'right', 'center')
}

const getBottomLeftCoordinates = (rect) => {
  const x = rect.left
  const y = rect.top + rect.height

  return getCoordsByPosition(x, y, 'left', 'bottom')
}

const getBottomCoordinates = (rect) => {
  const x = rect.left + (rect.width / 2)
  const y = rect.top + rect.height

  return getCoordsByPosition(x, y, 'center', 'bottom')
}

const getBottomRightCoordinates = (rect) => {
  const x = rect.left + rect.width
  const y = rect.top + rect.height

  return getCoordsByPosition(x, y, 'right', 'bottom')
}

const getElementCoordinatesByPositionRelativeToXY = ($el, x, y) => {
  const positionProps = getElementPositioning($el)

  const { fromViewport, fromWindow } = positionProps

  fromViewport.left += x
  fromViewport.top += y

  fromWindow.left += x
  fromWindow.top += y

  const viewportTargetCoords = getTopLeftCoordinates(fromViewport)
  const windowTargetCoords = getTopLeftCoordinates(fromWindow)

  fromViewport.x = viewportTargetCoords.x
  fromViewport.y = viewportTargetCoords.y

  fromWindow.x = windowTargetCoords.x
  fromWindow.y = windowTargetCoords.y

  return positionProps
}

const getElementCoordinatesByPosition = ($el, position) => {
  position = position || 'center'

  const positionProps = getElementPositioning($el)

  // get the coordinates from the window
  // but also from the viewport so
  // whoever is calling us can use it
  // however they'd like
  const { width, height, fromViewport, fromWindow } = positionProps

  // dynamically call the by transforming the nam=> e
  // bottom -> getBottomCoordinates
  // topLeft -> getTopLeftCoordinates
  const capitalizedPosition = position.charAt(0).toUpperCase() + position.slice(1)

  const fnName = `get${capitalizedPosition}Coordinates`

  const fn = calculations[fnName]

  // get the desired x/y coords based on
  // what position we're trying to target
  const viewportTargetCoords = fn({
    width,
    height,
    top: fromViewport.top,
    left: fromViewport.left,
  })

  // get the desired x/y coords based on
  // what position we're trying to target
  const windowTargetCoords = fn({
    width,
    height,
    top: fromWindow.top,
    left: fromWindow.left,
  })

  fromViewport.x = viewportTargetCoords.x
  fromViewport.y = viewportTargetCoords.y

  fromWindow.x = windowTargetCoords.x
  fromWindow.y = windowTargetCoords.y

  // return an object with both sets
  // of normalized coordinates for both
  // the window and the viewport
  return {
    width,
    height,
    fromViewport,
    fromWindow,
  }
}

const calculations = {
  getTopCoordinates,
  getTopLeftCoordinates,
  getTopRightCoordinates,
  getLeftCoordinates,
  getCenterCoordinates,
  getRightCoordinates,
  getBottomLeftCoordinates,
  getBottomCoordinates,
  getBottomRightCoordinates,
}

module.exports = {
  getCoordsByPosition,

  getElementPositioning,

  getElementAtPointFromViewport,

  getElementCoordinatesByPosition,

  getElementCoordinatesByPositionRelativeToXY,
}
