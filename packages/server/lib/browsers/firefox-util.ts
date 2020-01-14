/* eslint-disable no-console */

import Bluebird from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import Marionette from 'marionette-client'
import Exception from 'marionette-client/lib/marionette/error'
import { Command } from 'marionette-client/lib/marionette/message.js'
import util from 'util'
import Foxdriver from '@benmalka/foxdriver'
import protocol from './protocol'

type CollectGarbageArgs = {
  shouldRunGc: boolean
  shouldRunCc: boolean
}

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

let cb: (args: CollectGarbageArgs) => Promise<void>

let timings = {
  gc: [] as any[],
  cc: [] as any[],
  collections: [] as any[],
}

const log = () => {
  const reducedTimings = {
    ...timings,
    collections: _.map(timings.collections, (event) => {
      return _
      .chain(event)
      .extend({
        duration: _.sumBy(event.collections, (collection: any) => {
          return collection.endTimestamp - collection.startTimestamp
        }),
        spread: _.chain(event.collections).thru((collection) => {
          const first = _.first(collection)
          const last = _.last(collection)

          return last.endTimestamp - first.startTimestamp
        }).value(),
      })
      .pick('num', 'nonincrementalReason', 'reason', 'gcCycleNumber', 'duration', 'spread')
      .value()
    }),
  }

  console.log('timings', util.inspect(reducedTimings, {
    breakLength: Infinity,
    maxArrayLength: Infinity,
  }))

  console.log('times', {
    gc: reducedTimings.gc.length,
    cc: reducedTimings.cc.length,
    collections: reducedTimings.collections.length,
  })

  console.log('average', {
    gc: _.chain(reducedTimings.gc).sum().divide(reducedTimings.gc.length).value(),
    cc: _.chain(reducedTimings.cc).sum().divide(reducedTimings.cc.length).value(),
    collections: _.chain(reducedTimings.collections).sumBy('duration').divide(reducedTimings.collections.length).value(),
    spread: _.chain(reducedTimings.collections).sumBy('spread').divide(reducedTimings.collections.length).value(),
  })

  console.log('total', {
    gc: _.sum(reducedTimings.gc),
    cc: _.sum(reducedTimings.cc),
    collections: _.sumBy(reducedTimings.collections, 'duration'),
    spread: _.sumBy(reducedTimings.collections, 'spread'),
  })

  // reset all the timings
  timings = {
    gc: [],
    cc: [],
    collections: [],
  }
}

export default {
  log () {
    log()
  },

  collectGarbage (args: CollectGarbageArgs) {
    return cb(args)
  },

  setup (extensions, url) {
    return Bluebird.all([
      this.setupFoxdriver(),
      this.setupMarionette(extensions, url),
    ])
  },

  async setupFoxdriver () {
    await protocol._connectAsync({
      host: '127.0.0.1',
      port: 2929,
    })

    console.log('_connectAsync')

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
          data.num = timings.collections.length + 1
          timings.collections.push(data)
          console.log('received garbage-collection', data)
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

    cb = (args: CollectGarbageArgs) => {
      let duration

      const gc = (tab) => {
        return () => {
          if (!args.shouldRunGc) {
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
          if (!args.shouldRunCc) {
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
      })
      .tapCatch((err) => {
        console.log('firefox RDP error', err.stack)
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
