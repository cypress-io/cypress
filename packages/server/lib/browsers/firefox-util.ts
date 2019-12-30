/* eslint-disable no-console */

import Bluebird from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import Marionette from 'marionette-client'
import Exception from 'marionette-client/lib/marionette/error'
import Foxdriver from '@benmalka/foxdriver'
import { Command } from 'marionette-client/lib/marionette/message.js'
import util from 'util'
import { _connectAsync } from './protocol'

const debug = Debug('cypress:server:browsers')

const promisify = (fn) => {
  return (...args) => {
    return new Bluebird((resolve, reject) => {
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

let timings = {
  gc: [] as any[],
  cc: [] as any[],
}

const log = () => {
  console.log('timings', util.inspect(timings, {
    breakLength: Infinity,
    maxArrayLength: Infinity,
  }))

  console.log('times', {
    gc: timings.gc.length,
    cc: timings.cc.length,
  })

  console.log('average', {
    gc: _.chain(timings.gc).sum().divide(timings.gc.length).value(),
    cc: _.chain(timings.cc).sum().divide(timings.cc.length).value(),
  })

  console.log('total', {
    gc: _.sum(timings.gc),
    cc: _.sum(timings.cc),
  })

  // reset all the timings
  timings = {
    gc: [],
    cc: [],
  }
}

module.exports = {
  log () {
    log()
  },

  collectGarbage () {
    return cb()
  },

  setup (extensions, url) {
    return Bluebird.all([
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

    const attach = Bluebird.method((tab) => {
      return tab.memory.attach()
    })

    cb = () => {
      let duration

      const gc = (tab) => {
        return () => {
          console.time('garbage collection')
          duration = Date.now()

          return tab.memory.forceGarbageCollection()
          .then(() => {
            console.timeEnd('garbage collection')

            timings.gc.push(Date.now() - duration)
          })
        }
      }

      const cc = (tab) => {
        return () => {
          console.time('cycle collection')
          duration = Date.now()

          return tab.memory.forceCycleCollection()
          .then(() => {
            console.timeEnd('cycle collection')

            timings.cc.push(Date.now() - duration)
          })
        }
      }

      return browser.listTabs()
      .then((tabs) => {
        browser.tabs = tabs

        return Bluebird.mapSeries(tabs, (tab: any) => {
          return attach(tab)
          .then(gc(tab))
          .then(cc(tab))
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

    const connect = Bluebird.promisify(driver.connect.bind(driver))
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
      return Bluebird.all(_.map(extensions, (path) => {
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
