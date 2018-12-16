/* eslint-disable
    default-case,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $window = require('./window')

const getElementAtPointFromViewport = (doc, x, y) => {
  return doc.elementFromPoint(x, y)
}

const getElementPositioning = function ($el) {
  const el = $el[0]

  const win = $window.getWindowByElement(el)

  //# properties except for width / height
  //# are relative to the top left of the viewport
  const rect = el.getBoundingClientRect()

  const center = getCenterCoordinates(rect)

  //# add the center coordinates
  //# because its useful to any caller
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

const getCoordsByPosition = function (left, top, xPosition = 'center', yPosition = 'center') {
  left = (() => {
    switch (xPosition) {
      case 'left': return Math.ceil(left)
      case 'center': return Math.floor(left)
      case 'right': return Math.floor(left) - 1
    }
  })()

  top = (() => {
    switch (yPosition) {
      case 'top': return Math.ceil(top)
      case 'center': return Math.floor(top)
      case 'bottom': return Math.floor(top) - 1
    }
  })()

  //# returning x/y here because this is
  //# about the target position we want
  //# to fire the event at based on what
  //# the desired xPosition and yPosition is
  return {
    x: left,
    y: top,
  }
}

const getTopLeftCoordinates = function (rect) {
  const x = rect.left
  const y = rect.top

  return getCoordsByPosition(x, y, 'left', 'top')
}

const getTopCoordinates = function (rect) {
  const x = rect.left + (rect.width / 2)
  const y = rect.top

  return getCoordsByPosition(x, y, 'center', 'top')
}

const getTopRightCoordinates = function (rect) {
  const x = rect.left + rect.width
  const y = rect.top

  return getCoordsByPosition(x, y, 'right', 'top')
}

const getLeftCoordinates = function (rect) {
  const x = rect.left
  const y = rect.top + (rect.height / 2)

  return getCoordsByPosition(x, y, 'left', 'center')
}

const getCenterCoordinates = function (rect) {
  const x = rect.left + (rect.width / 2)
  const y = rect.top + (rect.height / 2)

  return getCoordsByPosition(x, y, 'center', 'center')
}

const getRightCoordinates = function (rect) {
  const x = rect.left + rect.width
  const y = rect.top + (rect.height / 2)

  return getCoordsByPosition(x, y, 'right', 'center')
}

const getBottomLeftCoordinates = function (rect) {
  const x = rect.left
  const y = rect.top + rect.height

  return getCoordsByPosition(x, y, 'left', 'bottom')
}

const getBottomCoordinates = function (rect) {
  const x = rect.left + (rect.width / 2)
  const y = rect.top + rect.height

  return getCoordsByPosition(x, y, 'center', 'bottom')
}

const getBottomRightCoordinates = function (rect) {
  const x = rect.left + rect.width
  const y = rect.top + rect.height

  return getCoordsByPosition(x, y, 'right', 'bottom')
}

const getElementCoordinatesByPositionRelativeToXY = function ($el, x, y) {
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

const getElementCoordinatesByPosition = function ($el, position = 'center') {
  const positionProps = getElementPositioning($el)

  //# get the coordinates from the window
  //# but also from the viewport so
  //# whoever is calling us can use it
  //# however they'd like
  const { width, height, fromViewport, fromWindow } = positionProps

  //# dynamically call the function by transforming the name
  //# bottom -> getBottomCoordinates
  //# topLeft -> getTopLeftCoordinates
  const capitalizedPosition = position.charAt(0).toUpperCase() + position.slice(1)

  const fnName = `get${capitalizedPosition}Coordinates`

  const fn = calculations[fnName]

  //# get the desired x/y coords based on
  //# what position we're trying to target
  const viewportTargetCoords = fn({
    width,
    height,
    top: fromViewport.top,
    left: fromViewport.left,
  })

  //# get the desired x/y coords based on
  //# what position we're trying to target
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

  //# return an object with both sets
  //# of normalized coordinates for both
  //# the window and the viewport
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
