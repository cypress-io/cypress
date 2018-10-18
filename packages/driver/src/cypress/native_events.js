require('@babel/polyfill')

window.criRequest = function () {}
const CRI = require('chrome-remote-interface')

const Promise = require('bluebird')
const debug = require('debug')('cypress:driver')

let client

const init = () => {
  return Promise.try(() => {
    if (client) {
      return client
    }
    // console.log('cy config', Cypress.config())
    const wsUrl = Cypress.config('wsUrl') //'sdf'//window.config.wsUrl

    return CRI({
      target: wsUrl,
      local: true,
    })
    .then((cri_client) => {
      client = cri_client

    })
    .catch((e) => { })
  })
}

const mousedown = ($elToClick, coords) => {
  // const x = coords.x + (coords.right - coords.left) / 2
  // const y = coords.y + (coords.bottom - coords.top) / 2
  const { x, y } = calculateTrueCoords(coords, $elToClick)
  return client.send('Input.dispatchMouseEvent', {
    x,
    y,
    type: 'mouseMoved',
  })

  .then(() => {
    return client.send('Input.dispatchMouseEvent', {
      x: coords.x,
      y: coords.y,
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
}


const calculateTrueCoords = (coords, $elToClick) => {
  let x = coords.x
  let y = coords.y
  let curWindow = $elToClick.ownerDocument.defaultView
  while (curWindow.frameElement) {
    const frame = curWindow.frameElement
    const rect = frame.getBoundingClientRect()
    x += rect.x
    y += rect.y
    curWindow = curWindow.parent
  }
  return { x, y }
}
