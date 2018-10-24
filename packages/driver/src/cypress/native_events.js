require('@babel/polyfill')
const Promise = require('bluebird')
const CRI = require('chrome-remote-interface')

const elements = require('../dom/elements')
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

const mousedown = ($elToClick, coords) => {
  const { x, y } = calculateTrueCoords(coords, $elToClick)
  return init()
  .then(() => {
    client.send('Input.dispatchMouseEvent', {
      x,
      y,
      type: 'mouseMoved',
    })
  })

  .then(() => {
    return client.send('Input.dispatchMouseEvent', {
      x,
      y,
      type: 'mousePressed',
      button: 'left',
      clickCount: 1,
    })
  })
}

const mouseup = ($elToClick, coords) => {
  const { x, y } = calculateTrueCoords(coords, $elToClick)
  return client.send('Input.dispatchMouseEvent', {
    x,
    y,
    type: 'mouseReleased',
    button: 'left',
    clickCount: 1,
  })
}

module.exports = {
  mousedown,
  mouseup,
  init,
}


function calculateTrueCoords (coords, $elToClick) {
  let x = coords.x
  let y = coords.y
  let curWindow = $elToClick[0].ownerDocument.defaultView

  while (elements.getNativeProp(curWindow, 'frameElement')) {
    const frame = elements.getNativeProp(curWindow, 'frameElement')
    const scale = frame.parentElement.style.transform.match(/\((.*)\)/)[1]
    const rect = frame.getBoundingClientRect()

    // Cypress will sometimes miss the Iframe if coords are too small
    // remove this when test-runner is extracted out
    x = Math.max(x * scale, 5) + rect.x
    y = Math.max(y * scale, 2) + rect.y
    curWindow = curWindow.parent
  }
  return { x, y }
}
