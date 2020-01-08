/* eslint-disable no-console */

import Bluebird from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import Marionette from 'marionette-client'
import Exception from 'marionette-client/lib/marionette/error'
import { Command } from 'marionette-client/lib/marionette/message.js'
import util from 'util'
import Foxdriver from '@benmalka/foxdriver'
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
  events: [] as any[],
}

const log = () => {
  console.log('timings', util.inspect(timings, {
    breakLength: Infinity,
    maxArrayLength: Infinity,
  }))

  console.log('times', {
    gc: timings.gc.length,
    cc: timings.cc.length,
    events: timings.events.length,
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
    events: [],
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
      if (tab.memory.isAttached) {
        return
      }

      return tab.memory.getState()
      .then((state) => {
        if (state === 'attached') {
          return
        }

        tab.memory.on('garbage-collection', ({ data }) => {
          console.log('received garbage-collection', data)
          timings.events.push(data)
        })

        return tab.memory.attach()
      })
    })

    const getTabId = (tab) => {
      return _.get(tab, 'browsingContextID')
    }

    const getPrimaryTab = Bluebird.method((browser) => {
      const setPrimaryTab = () => {
        return browser.listTabs()
        .then((tabs) => {
          browser.tabs = tabs

          return browser.primaryTab = _.first(tabs)
        })
      }

      if (!browser.primaryTab) {
        return setPrimaryTab()
      }

      return browser.request('listTabs')
      .then(({ tabs }) => {
        const firstTab = _.first(tabs)

        if (getTabId(browser.primaryTab.data) !== getTabId(firstTab)) {
          return setPrimaryTab()
        }

        return browser.primaryTab
      })
    })

    cb = () => {
      let duration

      const gc = (tab) => {
        return () => {
          if (process.env.CYPRESS_SKIP_GC) {
            return
          }

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
          if (process.env.CYPRESS_SKIP_CC) {
            return
          }

          console.time('cycle collection')
          duration = Date.now()

          return tab.memory.forceCycleCollection()
          .then(() => {
            console.timeEnd('cycle collection')

            timings.cc.push(Date.now() - duration)
          })
        }
      }

      return getPrimaryTab(browser)
      .then((tab) => {
        return attach(tab)
        .then(gc(tab))
        .then(cc(tab))
        // .then(() => {
        //   return tab.memory.measure()
        // .then(console.log)
        // })
        // })
      })
      .tapCatch((err) => {
        console.log('firefox RDP error', err.stack)

        // eslint-disable-next-line no-debugger
        debugger
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
