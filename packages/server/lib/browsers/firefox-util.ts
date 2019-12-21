import _ from 'lodash'
import Marionette from 'marionette-client'
import Exception from 'marionette-client/lib/marionette/error'
import Foxdriver from 'foxdriver'
import { Command } from 'marionette-client/lib/marionette/message.js'
import {
  _connectAsync,
} from './protocol'
import Promise from 'bluebird'
import Debug from 'debug'

const debug = Debug('cypress:server:browsers')

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

let sendMarionette

let cb

module.exports = {
  collectGarbage () {
    return cb()
  },

  setup (extensions, url) {
    return Promise.all([
      this.setupFoxdriver(),
      this.setupMarionette(extensions, url),
    ])
  },

  async setupFoxdriver () {
    await _connectAsync({
      host: '127.0.0.1',
      port: 2929,
    })

    const foxdriver = await Foxdriver.attach('127.0.0.1', 2929)

    const { browser } = foxdriver

    const attach = Promise.method((tab) => {
      return tab.memory.attach()
    })

    cb = () => {
      return browser.listTabs()
      .then((tabs) => {
        browser.tabs = tabs

        return Promise.mapSeries(tabs, (tab: any) => {
          return attach(tab)
          .then(() => {
            return tab.memory.forceCycleCollection()
          })
          .then(() => {
            return tab.memory.forceGarbageCollection()
          })
          // .then(() => {
          // return tab.memory.measure()
          // .then(console.log)
          // })
          .then(() => {
            return tab.memory.detach()
          })
        })
      })
    }
  },

  setupMarionette (extensions, url) {
    const driver = new Marionette.Drivers.Tcp({})

    const connect = Promise.promisify(driver.connect.bind(driver))
    const driverSend = promisify(driver.send.bind(driver))

    sendMarionette = (data) => {
      return driverSend(new Command(data))
    }

    debug('firefox: navigating page with webdriver')

    return connect()
    .then(() => {
      return sendMarionette({
        name: 'WebDriver:NewSession',
        parameters: { acceptInsecureCerts: true },
      })
    })
    .then(({ sessionId }) => {
      return Promise.all(_.map(extensions, (path) => {
        return sendMarionette({
          name: 'Addon:Install',
          sessionId,
          parameters: { path, temporary: true },
        })
      }))
      .then(() => {
        return sendMarionette({
          name: 'WebDriver:Navigate',
          sessionId,
          parameters: { url },
        })
      })
    })
  },
}
