import Bluebird from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import Marionette from 'marionette-client'
import { Command } from 'marionette-client/lib/marionette/message.js'
import util from 'util'
import Foxdriver from '@benmalka/foxdriver'
import * as protocol from './protocol'
import { CdpAutomation } from './cdp_automation'
import { BrowserCriClient } from './browser-cri-client'
import type { Automation } from '../automation'

const errors = require('../errors')

const debug = Debug('cypress:server:browsers:firefox-util')

let forceGcCc: () => Promise<void>

let timings = {
  gc: [] as any[],
  cc: [] as any[],
  collections: [] as any[],
}

let driver

const sendMarionette = (data) => {
  return driver.send(new Command(data))
}

const getTabId = (tab) => {
  return _.get(tab, 'browsingContextID')
}

const getDelayMsForRetry = (i) => {
  if (i < 10) {
    return 100
  }

  if (i < 18) {
    return 500
  }

  if (i < 63) {
    return 1000
  }

  return
}

const getPrimaryTab = Bluebird.method((browser) => {
  const setPrimaryTab = () => {
    return browser.listTabs()
    .then((tabs) => {
      browser.tabs = tabs

      return browser.primaryTab = _.first(tabs)
    })
  }

  // on first connection
  if (!browser.primaryTab) {
    return setPrimaryTab()
  }

  // `listTabs` will set some internal state, including marking attached tabs
  // as detached. so use the raw `request` here:
  return browser.request('listTabs')
  .then(({ tabs }) => {
    const firstTab = _.first(tabs)

    // primaryTab has changed, get all tabs and rediscover first tab
    if (getTabId(browser.primaryTab.data) !== getTabId(firstTab)) {
      return setPrimaryTab()
    }

    return browser.primaryTab
  })
})

const attachToTabMemory = Bluebird.method((tab) => {
  // TODO: figure out why tab.memory is sometimes undefined
  if (!tab.memory) return

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
      debug('received garbage-collection event %o', data)
    })

    return tab.memory.attach()
  })
})

async function connectMarionetteToNewTab () {
  // When firefox closes its last tab, it keeps a blank tab open. This will be the only handle
  // So we will connect to it and navigate it to about:blank to set it up for CDP connection
  const handles = await sendMarionette({
    name: 'WebDriver:GetWindowHandles',
  })

  await sendMarionette({
    name: 'WebDriver:SwitchToWindow',
    parameters: { handle: handles[0] },
  })

  await navigateToUrl('about:blank')
}

async function connectToNewSpec (options, automation: Automation, browserCriClient: BrowserCriClient) {
  debug('firefox: reconnecting to blank tab')

  await connectMarionetteToNewTab()

  debug('firefox: reconnecting CDP')

  const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

  await CdpAutomation.create(pageCriClient.send, pageCriClient.on, browserCriClient.resetBrowserTargets, automation, options.experimentalSessionAndOrigin)

  await options.onInitializeNewBrowserTab()

  debug(`firefox: navigating to ${options.url}`)
  await navigateToUrl(options.url)
}

async function setupRemote (remotePort, automation, onError, options): Promise<BrowserCriClient> {
  const browserCriClient = await BrowserCriClient.create(['127.0.0.1', '::1'], remotePort, 'Firefox', onError)
  const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

  await CdpAutomation.create(pageCriClient.send, pageCriClient.on, browserCriClient.resetBrowserTargets, automation, options.experimentalSessionAndOrigin)

  return browserCriClient
}

async function navigateToUrl (url) {
  await sendMarionette({
    name: 'WebDriver:Navigate',
    parameters: { url },
  })
}

const logGcDetails = () => {
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

  debug('forced GC timings %o', util.inspect(reducedTimings, {
    breakLength: Infinity,
    maxArrayLength: Infinity,
  }))

  debug('forced GC times %o', {
    gc: reducedTimings.gc.length,
    cc: reducedTimings.cc.length,
    collections: reducedTimings.collections.length,
  })

  debug('forced GC averages %o', {
    gc: _.chain(reducedTimings.gc).sum().divide(reducedTimings.gc.length).value(),
    cc: _.chain(reducedTimings.cc).sum().divide(reducedTimings.cc.length).value(),
    collections: _.chain(reducedTimings.collections).sumBy('duration').divide(reducedTimings.collections.length).value(),
    spread: _.chain(reducedTimings.collections).sumBy('spread').divide(reducedTimings.collections.length).value(),
  })

  debug('forced GC totals %o', {
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
    logGcDetails()
  },

  collectGarbage () {
    return forceGcCc()
  },

  setup ({
    automation,
    extensions,
    onError,
    url,
    marionettePort,
    foxdriverPort,
    remotePort,
    options,
  }): Bluebird<BrowserCriClient> {
    return Bluebird.all([
      this.setupFoxdriver(foxdriverPort),
      this.setupMarionette(extensions, url, marionettePort),
      remotePort && setupRemote(remotePort, automation, onError, options),
    ]).then(([,, browserCriClient]) => navigateToUrl(url).then(() => browserCriClient))
  },

  connectToNewSpec,

  navigateToUrl,

  setupRemote,

  async setupFoxdriver (port) {
    await protocol._connectAsync({
      host: '127.0.0.1',
      port,
      getDelayMsForRetry,
    })

    const foxdriver = await Foxdriver.attach('127.0.0.1', port)

    const { browser } = foxdriver

    browser.on('error', (err) => {
      debug('received error from foxdriver connection, ignoring %o', err)
    })

    forceGcCc = () => {
      let gcDuration; let ccDuration

      const gc = (tab) => {
        return () => {
          // TODO: figure out why tab.memory is sometimes undefined
          if (!tab.memory) return

          const start = Date.now()

          return tab.memory.forceGarbageCollection()
          .then(() => {
            gcDuration = Date.now() - start
            timings.gc.push(gcDuration)
          })
        }
      }

      const cc = (tab) => {
        return () => {
          // TODO: figure out why tab.memory is sometimes undefined
          if (!tab.memory) return

          const start = Date.now()

          return tab.memory.forceCycleCollection()
          .then(() => {
            ccDuration = Date.now() - start
            timings.cc.push(ccDuration)
          })
        }
      }

      debug('forcing GC and CC...')

      return getPrimaryTab(browser)
      .then((tab) => {
        return attachToTabMemory(tab)
        .then(gc(tab))
        .then(cc(tab))
      })
      .then(() => {
        debug('forced GC and CC completed %o', { ccDuration, gcDuration })
      })
      .tapCatch((err) => {
        debug('firefox RDP error while forcing GC and CC %o', err)
      })
    }
  },

  async setupMarionette (extensions, url, port) {
    await protocol._connectAsync({
      host: '127.0.0.1',
      port,
      getDelayMsForRetry,
    })

    driver = new Marionette.Drivers.Promises({
      port,
      tries: 1, // marionette-client has its own retry logic which we want to avoid
    })

    debug('firefox: navigating page with webdriver')

    const onError = (from, reject?) => {
      if (!reject) {
        reject = (err) => {
          throw err
        }
      }

      return (err) => {
        debug('error in marionette %o', { from, err })
        reject(errors.get('FIREFOX_MARIONETTE_FAILURE', from, err))
      }
    }

    await driver.connect()
    .catch(onError('connection'))

    await new Bluebird((resolve, reject) => {
      const _onError = (from) => {
        return onError(from, reject)
      }

      const { tcp } = driver

      tcp.socket.on('error', _onError('Socket'))
      tcp.client.on('error', _onError('CommandStream'))

      sendMarionette({
        name: 'WebDriver:NewSession',
        parameters: { acceptInsecureCerts: true },
      }).then(() => {
        return Bluebird.all(_.map(extensions, (path) => {
          return sendMarionette({
            name: 'Addon:Install',
            parameters: { path, temporary: true },
          })
        }))
      })
      .then(resolve)
      .catch(_onError('commands'))
    })

    // even though Marionette is not used past this point, we have to keep the session open
    // or else `acceptInsecureCerts` will cease to apply and SSL validation prompts will appear.
  },

  async windowFocus () {
  // in order to utilize focusmanager.testingmode and trick browser into being in focus even when not focused
  // this is critical for headless mode since otherwise the browser never gains focus
    return sendMarionette({
      name: 'WebDriver:ExecuteScript',
      parameters: {
        'args': [],
        'script': `return (() => {
        top.focus()
      }).apply(null, arguments)\
      `,
      },
    })
  },
}
