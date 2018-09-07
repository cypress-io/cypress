console.log('native events ')
const _ = require('lodash')
// const $Cypress = require('../cypress')

window.criRequest = (options, callback) => {

}

require('@babel/polyfill')
const CRI = require('chrome-remote-interface')

console.log('loaded CRI')
const Promise = require('bluebird')
const debug = require('debug')('cypress:driver')

let client

const init = () => {
  return Promise.try(() => {

    if (client) {
      return client
    }
    console.log('cy config', Cypress.config())
    const wsUrl = Cypress.config('wsUrl')//'sdf'//window.config.wsUrl
    return CRI(wsUrl)
    .then((cri_client) => {

      client = cri_client
    })
    .catch((e) => {

    })
  })
}

const mousedown = (coords) => {

  const x = coords.x + (coords.right - coords.left) / 2
  const y = coords.y + (coords.bottom - coords.top) / 2


  return init()
  .then(() => {
    return client.send('Input.dispatchMouseEvent', {
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

const mouseup = (coords) => {

  const x = coords.x + (coords.right - coords.left) / 2
  const y = coords.y + (coords.bottom - coords.top) / 2

  return init()
  .then(() => {

    return client.send('Input.dispatchMouseEvent', {
      x,
      y,
      type: 'mouseReleased',
      button: 'left',
      clickCount: 1,
    })
  })


}
console.log('export')
module.exports = {
  mousedown,
  mouseup,
}
