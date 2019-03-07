// require('@babel/polyfill')
const _ = require('lodash')
const CRI = require('chrome-remote-interface')
const Promise = require('bluebird')
// const _ = require('lodash')
// const debug = require('debug')('cypress:driver')
const elements = require('../dom/elements')

// eslint-disable-next-line
window.criRequest = function() {}

let client

const init = () => {
  return Promise.try(() => {
    // TODO: call init method only once, in the right place
    if (client) {
      return client
    }

    // TODO: import Cypress correctly
    // eslint-disable-next-line
    const wsUrl = Cypress.config('wsUrl')

    return CRI({
      target: wsUrl,
      local: true,
    })
    .then((cri_client) => {
      client = cri_client
    })
    .catch(() => {})
  })
}

const click = ($elToClick, coords, modifiers) => {
  return init().then(() => {
    const { coordsFromAutIframe, autIframe } = calculateAutIframeCoords(
      coords,
      $elToClick
    )
    // TODO: import Cypress correctly
    // eslint-disable-next-line
    Cypress.action('cy:before:native:event', coordsFromAutIframe)
    const coordsToClick = calculateCoordsToClick(coordsFromAutIframe, autIframe)

    return Promise.all([
      mouseMoved(coordsToClick, modifiers),
      mouseDown(coordsToClick, modifiers),
      mouseUp(coordsToClick, modifiers),
    ]).finally(() => {
      // TODO: import Cypress correctly
      // eslint-disable-next-line
      Cypress.action('cy:after:native:event')
    })
  })
}

const mouseMoved = (coords, modifiers) => {
  return mouseEvent(coords, 'mouseMoved', modifiers)
}
const mouseDown = (coords, modifiers) => {
  return mouseEvent(coords, 'mousePressed', modifiers)
}
const mouseUp = (coords, modifiers) => {
  return mouseEvent(coords, 'mouseReleased', modifiers)
}

const mouseEvent = (coords, type, modifiers) => {
  const { x, y } = coords

  return client.send('Input.dispatchMouseEvent', {
    x,
    y,
    type,
    button: 'left',
    clickCount: 1,
    modifiers,
  })
}

const keypress = (keyInfo) => {
  return init().then(() => {
    return Promise.all([keyDown(keyInfo), keyUp(keyInfo)])
  })
}

function keypressAll (keyInfoArray) {
  return init().then(() => {
    return Promise.all(
      _.flatten(
        keyInfoArray.map((keyInfo) => {
          return [keyDown(keyInfo), keyUp(keyInfo)]
        })
      )
    )
  })
}

const keyDown = (keyInfo) => {
  return Promise.resolve(
    client.send('Input.dispatchKeyEvent', {
      // type: text ? 'keyDown' : 'rawKeyDown',
      type: keyInfo.text ? 'keyDown' : 'rawKeyDown',
      modifiers: keyInfo.modifiers,
      windowsVirtualKeyCode: keyInfo.keyCode,
      code: keyInfo.code,
      key: keyInfo.key,
      text: keyInfo.text,
      // unmodifiedText: text,
      // autoRepeat,
      location: keyInfo.location,
      isKeypad: keyInfo.location === 3,
    })
  )
}

const keyUp = (keyInfo) => {
  return client.send('Input.dispatchKeyEvent', {
    // type: text ? 'keyUp' : 'rawKeyUp',
    type: 'keyUp',
    // modifiers: this._modifiers,
    windowsVirtualKeyCode: keyInfo.keyCode,
    code: keyInfo.code,
    key: keyInfo.key,
    text: keyInfo.text,
    // unmodifiedText: text,
    // autoRepeat,
    location: keyInfo.location,
    isKeypad: keyInfo.location === 3,
  })
}

module.exports = {
  mouseDown,
  mouseUp,
  click,
  keypress,
  keypressAll,
  init,
}

function calculateAutIframeCoords (coords, $elToClick) {
  let x = coords.x
  let y = coords.y
  let curWindow = $elToClick[0].ownerDocument.defaultView
  let frame

  while (elements.getNativeProp(curWindow, 'frameElement')) {
    frame = elements.getNativeProp(curWindow, 'frameElement')
    curWindow = curWindow.parent

    if (curWindow && elements.getNativeProp(curWindow, 'frameElement')) {
      const rect = frame.getBoundingClientRect()

      x += rect.x
      y += rect.y
    }
    // Cypress will sometimes miss the Iframe if coords are too small
    // remove this when test-runner is extracted out
  }

  return {
    coordsFromAutIframe: { x, y },
    autIframe: frame,
  }
}

function calculateCoordsToClick (coordsFromAutIframe, autIframe) {
  const { x, y } = coordsFromAutIframe
  const iframeRect = autIframe.getBoundingClientRect()

  return {
    x: x + iframeRect.x,
    y: y + iframeRect.y,
  }
}
