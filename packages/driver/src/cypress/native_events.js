console.log('native events ')
const _ = require('lodash')

const CRI = require('chrome-remote-interface')
console.log('loaded CRI')
const Promise = require('bluebird')
const debug = require('debug')('cypress:driver')
let client

const init = () => {
  debug('native init')
  console.log('native init')
  Promise.try(() => {
    if (client) return
    return CRI.List()
    .then((targets) => {
      // activate the first available id
      console.log(targets)

      // find the first target page that's a real tab
      // and not the dev tools
      const target = _.find(targets, (t) => {
        return t.type === 'page' && t.url.startsWith('http')
      })

      console.log('target is', target)

      return CRI({ target }, (newClient) => client = newClient)
    })
  })
}


const mousedown = (coords) => {

  const x = coords.x + coords.width / 2
  const y = coords.y + coords.height / 2

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

  const x = coords.x + coords.width / 2
  const y = coords.y + coords.height / 2

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
