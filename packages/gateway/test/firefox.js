require('../../../scripts/link-packages')()
require('../../coffee/register')
const path = require('path')
const Marionette = require('marionette-client')
const Exception = require('marionette-client/lib/marionette/error')
const Promise = require('bluebird')
const Command = require('marionette-client/lib/marionette/message.js').Command
const _ = require('lodash')

const firefox = require('../../server/lib/browsers/firefox.coffee')

const promisify = (fn) => (...args) => {
  return new Promise((resolve, reject) => {
    fn(...args, (data) => {
      if ('error' in data) {
        reject(new Exception(data))
      } else {
        resolve(data)
      }
    })
  })
}

const driver = new Marionette.Drivers.Tcp({})

const connect = Promise.promisify(driver.connect.bind(driver))
const driverSend = promisify(driver.send.bind(driver))

const send = (data) => {
  return driverSend(new Command(data))
}


firefox.open('firefox', 'about:blank')
.then(({ sessionId }) => {
  return require('../server').start({sessionId})
  .then(() => {
    return require('../server/static').start()
  })
  .then(() => {
    return send({
      name: 'WebDriver:Navigate',
      sessionId,
      parameters: { url: 'http://localhost:3001' },
    })
  })
})
