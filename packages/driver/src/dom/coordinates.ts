import _ from 'lodash'
import $window from './window'
import $elements from './elements'
import $jquery from './jquery'

const getElementAtPointFromViewport = (doc: Document, x: number, y: number) => {
  return $elements.elementFromPoint(doc, x, y)
}

const isAUTFrame = (win) => {
  const parent = win.parent

  // https://github.com/cypress-io/cypress/issues/6412
  // ensure the parent is a Window before checking prop
  if (!$window.isWindow(parent)) {
    return false
  }

  try {
    // window.frameElement only exists on iframe windows, so if it doesn't
    // exist on parent, it must be the top frame, and `win` is the AUT
    return !$elements.getNativeProp(parent, 'frameElement')
  } catch (err) {
    // if the AUT is cross-origin, accessing parent.frameElement will throw
    // a cross-origin error, meaning this is the AUT
    // NOTE: this will need to be updated once we add support for
    // cross-origin iframes
    if (err.name !== 'SecurityError') {
      // re-throw any error that's not a cross-origin error
      throw err
    }

    return true
  }
}

const getFirstValidSizedRect = (el) => {
  return _.find(el.getClientRects(), (rect) => {
    // use the first rect that has a nonzero width and height
    return rect.width && rect.height
  }) || el.getBoundingClientRect() // otherwise fall back to the parent client rect
}

export type ElViewportPostion = {
  doc: Document
  x?: number
  y?: number
  top: number
  left: number
  right: number
  bottom: number
  topCenter: number
  leftCenter: number
}

export type ElWindowPostion = {
  x?: number
  y?: number
  top: number
  left: number
  topCenter: number
  leftCenter: number
}

export type ElementPositioning = {
  scrollTop: number
  scrollLeft: number
  width: number
  height: number
  fromElViewport: ElViewportPostion
  fromElWindow: ElWindowPostion
  fromAutWindow: {
    x?: number
    y?: number
    top: number
    left: number
    topCenter: number
    leftCenter: number
  }
}

const getElementPositioning = ($el: JQuery<HTMLElement> | HTMLElement): ElementPositioning => {
  let autFrame

  const el: HTMLElement = $jquery.isJquery($el) ? $el[0] : $el

  const win = $window.getWindowByElement(el)

  // properties except for width / height
  // are relative to the top left of the viewport

  // we use the first of getClientRects in order to account for inline
  // elements that span multiple lines. Which would cause us to click
  // click in the center and thus miss...
  //
  // sometimes the first client rect has no height or width, which also causes a miss
  // so a simple loop is used to find the first with non-zero dimensions
  //
  // however we have a fallback to getBoundingClientRect() such as
  // when the element is hidden or detached from the DOM. getClientRects()
  // returns a zero length DOMRectList in that case, which becomes undefined.
  // so we fallback to getBoundingClientRect() so that we get an actual DOMRect
  // with all properties 0'd out
  const rect = getFirstValidSizedRect(el)

  // we want to return the coordinates from the autWindow to the element
  // which handles a situation in which the element is inside of a nested
  // iframe. we use these "absolute" coordinates from the autWindow to draw
  // things like the red hitbox - since the hitbox layer is placed on the
  // autWindow instead of the window the element is actually within
  const getRectFromAutIframe = (rect) => {
    let x = 0 //rect.left
    let y = 0 //rect.top
    let curWindow = win
    let frame

    // https://github.com/cypress-io/cypress/issues/6412
    // ensure the parent is a Window before checking prop
    // walk up from a nested iframe so we continually add the x + y values
    while ($window.isWindow(curWindow) && !isAUTFrame(curWindow) && curWindow.parent !== curWindow) {
      frame = $elements.getNativeProp(curWindow, 'frameElement')

      if (curWindow && frame) {
        const frameRect = frame.getBoundingClientRect()

        x += frameRect.left
        y += frameRect.top
      }

      curWindow = curWindow.parent
    }

    autFrame = curWindow

    return {
      left: x + rect.left,
      top: y + rect.top,
      right: x + rect.right,
      bottom: y + rect.top,
      width: rect.width,
      height: rect.height,
    }
  }

  const rectFromAut = getRectFromAutIframe(rect)
  const rectFromAutCenter = getCenterCoordinates(rectFromAut)

  // add the center coordinates
  // because its useful to any caller
  const rectCenter = getCenterCoordinates(rect)

  // rounding needed for firefox, which returns floating numbers
  const topCenter = Math.ceil(rectCenter.y)
  const leftCenter = Math.ceil(rectCenter.x)

  return {
    scrollTop: el.scrollTop,
    scrollLeft: el.scrollLeft,
    width: rect.width,
    height: rect.height,
    fromElViewport: {
      doc: win.document,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      topCenter,
      leftCenter,
    },
    fromElWindow: {
      top: Math.ceil(rect.top + win.scrollY),
      left: rect.left + win.scrollX,
      topCenter: Math.ceil(topCenter + win.scrollY),
      leftCenter: leftCenter + win.scrollX,
    },
    fromAutWindow: {
      top: Math.ceil(rectFromAut.top + autFrame.scrollY),
      left: rectFromAut.left + autFrame.scrollX,
      topCenter: Math.ceil(rectFromAutCenter.y + autFrame.scrollY),
      leftCenter: rectFromAutCenter.x + autFrame.scrollX,
    },
  }
}

const getCoordsByPosition = (
  left: number,
  top: number,
  xPosition: 'left' | 'center' | 'right' = 'center',
  yPosition: 'top' | 'center' | 'bottom' = 'center',
) => {
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

  const { fromElViewport, fromElWindow, fromAutWindow } = positionProps

  fromElViewport.left += x
  fromElViewport.top += y

  fromElWindow.left += x
  fromElWindow.top += y

  fromAutWindow.left += x
  fromAutWindow.top += y

  const viewportTargetCoords = getTopLeftCoordinates(fromElViewport)
  const windowTargetCoords = getTopLeftCoordinates(fromElWindow)
  const autWindowTargetCoords = getTopLeftCoordinates(fromAutWindow)

  fromElViewport.x = viewportTargetCoords.x
  fromElViewport.y = viewportTargetCoords.y

  fromElWindow.x = windowTargetCoords.x
  fromElWindow.y = windowTargetCoords.y

  fromAutWindow.x = autWindowTargetCoords.x
  fromAutWindow.y = autWindowTargetCoords.y

  return positionProps
}

const getElementCoordinatesByPosition = ($el, position?) => {
  position = position || 'center'

  const positionProps = getElementPositioning($el)

  // get the coordinates from the window
  // but also from the viewport so
  // whoever is calling us can use it
  // however they'd like
  const { width, height, fromElViewport, fromElWindow, fromAutWindow } = positionProps

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
    top: fromElViewport.top,
    left: fromElViewport.left,
  })

  // get the desired x/y coords based on
  // what position we're trying to target
  const windowTargetCoords = fn({
    width,
    height,
    top: fromElWindow.top,
    left: fromElWindow.left,
  })

  fromElViewport.x = viewportTargetCoords.x
  fromElViewport.y = viewportTargetCoords.y

  fromElWindow.x = windowTargetCoords.x
  fromElWindow.y = windowTargetCoords.y

  const autTargetCoords = fn({
    width,
    height,
    top: fromAutWindow.top,
    left: fromAutWindow.left,
  })

  fromAutWindow.x = autTargetCoords.x
  fromAutWindow.y = autTargetCoords.y

  // return an object with both sets
  // of normalized coordinates for both
  // the window and the viewport
  return {
    ...positionProps,
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

export default {
  getCoordsByPosition,

  getElementPositioning,

  getElementAtPointFromViewport,

  getElementCoordinatesByPosition,

  getElementCoordinatesByPositionRelativeToXY,

  isAUTFrame,
}
