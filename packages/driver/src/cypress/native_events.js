require('@babel/polyfill')
const Promise = require('bluebird')
const CRI = require('chrome-remote-interface')

const elements = require('../dom/elements')
// const _ = require('lodash')
// const debug = require('debug')('cypress:driver')

// eslint-disable-next-line
window.criRequest = function () {}

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
    .catch(() => { })
  })
}

const click = ($elToClick, coords) => {
  return init()
  .then(() => {
    const { coordsFromAutIframe, autIframe } = calculateAutIframeCoords(coords, $elToClick)
    // TODO: import Cypress correctly
    // eslint-disable-next-line
    Cypress.action('cy:before:native:event', coordsFromAutIframe)
    const coordsToClick = calculateCoordsToClick(coordsFromAutIframe, autIframe)
    return Promise.all([
      mouseMoved(coordsToClick),
      mouseDown(coordsToClick),
      mouseUp(coordsToClick),
    ])
    .finally(() => {
      // TODO: import Cypress correctly
      // eslint-disable-next-line
      Cypress.action('cy:after:native:event')
    })
  })
}

const mouseMoved = (coords) => {
  return mouseEvent(coords, 'mouseMoved')
}
const mouseDown = (coords) => {
  return mouseEvent(coords, 'mousePressed')
}
const mouseUp = (coords) => {
  return mouseEvent(coords, 'mouseReleased')
}

const mouseEvent = (coords, type) => {
  const { x, y } = coords
  return client.send('Input.dispatchMouseEvent', {
    x,
    y,
    type,
    button: 'left',
    clickCount: 1,
  })
}

module.exports = {
  mouseDown,
  mouseUp,
  click,
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
