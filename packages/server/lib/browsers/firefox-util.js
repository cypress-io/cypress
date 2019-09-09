const _ = require('lodash')
const Marionette = require('marionette-client')
const Exception = require('marionette-client/lib/marionette/error')
const Command = require('marionette-client/lib/marionette/message.js').Command
const Promise = require('bluebird')
const debug = require('debug')('cypress:server:browsers')

const promisify = (fn) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (data) => {
        if ('error' in data) {
          reject(new Exception(data, data))
        } else {
          resolve(data)
        }
      })
    })
  }
}

let send

module.exports = {
  send,

  setup (extensions, url) {

    const driver = new Marionette.Drivers.Tcp({})

    const connect = Promise.promisify(driver.connect.bind(driver))
    const driverSend = promisify(driver.send.bind(driver))

    send = (data) => {
      return driverSend(new Command(data))
    }

    debug('firefox: navigating page with webdriver')

    return connect()
    .then(() => {
      return send({
        name: 'WebDriver:NewSession',
        parameters: { acceptInsecureCerts: true },
      })
    })
    .then(({ sessionId }) => {
      return Promise.all(_.map(extensions, (path) => {
        return send({
          name: 'Addon:Install',
          sessionId,
          parameters: { path, temporary: true },
        })
      }))
      .then(() => {
        return send({
          name: 'WebDriver:Navigate',
          sessionId,
          parameters: { url },
        })
      })
      .return({ sessionId })
    })
  },
}
