import Bluebird from 'bluebird'
import Debug from 'debug'
import _ from 'lodash'
import util from 'util'
import Foxdriver from '@benmalka/foxdriver'
import * as protocol from './protocol'
import { CdpAutomation } from './cdp_automation'
import { BrowserCriClient } from './browser-cri-client'
import type { Automation } from '../automation'
import type { CypressError } from '@packages/errors'
import type { WebDriverClassic } from './webdriver-classic'

const debug = Debug('cypress:server:browsers:firefox-util')

let forceGcCc: () => Promise<void>

let timings = {
  gc: [] as any[],
  cc: [] as any[],
  collections: [] as any[],
}

let webDriverClassic: WebDriverClassic

const getTabId = (tab) => {
  return _.get(tab, 'browsingContextID')
}

const getDelayMsForRetry = (i) => {
  let maxRetries = Number.parseInt(process.env.CYPRESS_CONNECT_RETRY_THRESHOLD ? process.env.CYPRESS_CONNECT_RETRY_THRESHOLD : '62')

  if (i < 10) {
    return 100
  }

  if (i < 18) {
    return 500
  }

  if (i <= maxRetries) {
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

async function connectToNewTabClassic () {
  // Firefox keeps a blank tab open in versions of Firefox 123 and lower when the last tab is closed.
  // For versions 124 and above, a new tab is not created, so @packages/extension creates one for us.
  // Since the tab is always available on our behalf,
  // we can connect to it here and navigate it to about:blank to set it up for CDP connection
  const handles = await webDriverClassic.getWindowHandles()

  await webDriverClassic.switchToWindow(handles[0])

  await webDriverClassic.navigate('about:blank')
}

async function connectToNewSpec (options, automation: Automation, browserCriClient: BrowserCriClient) {
  debug('firefox: reconnecting to blank tab')

  await connectToNewTabClassic()

  debug('firefox: reconnecting CDP')

  if (browserCriClient) {
    await browserCriClient.currentlyAttachedTarget?.close().catch(() => {})
    const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

    await CdpAutomation.create(pageCriClient.send, pageCriClient.on, pageCriClient.off, browserCriClient.resetBrowserTargets, automation)
  }

  await options.onInitializeNewBrowserTab()

  debug(`firefox: navigating to ${options.url}`)
  await navigateToUrlClassic(options.url)
}

async function setupCDP (remotePort: number, automation: Automation, onError?: (err: Error) => void): Promise<BrowserCriClient> {
  const browserCriClient = await BrowserCriClient.create({ hosts: ['127.0.0.1', '::1'], port: remotePort, browserName: 'Firefox', onAsynchronousError: onError as (err: CypressError) => void, onServiceWorkerClientEvent: automation.onServiceWorkerClientEvent })
  const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

  await CdpAutomation.create(pageCriClient.send, pageCriClient.on, pageCriClient.off, browserCriClient.resetBrowserTargets, automation)

  return browserCriClient
}

async function navigateToUrlClassic (url: string) {
  await webDriverClassic.navigate(url)
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

  async setup ({
    automation,
    onError,
    url,
    foxdriverPort,
    remotePort,
    webDriverClassic: wdcInstance,
  }: {
    automation: Automation
    onError?: (err: Error) => void
    url: string
    foxdriverPort: number
    remotePort: number
    webDriverClassic: WebDriverClassic
  }): Promise<BrowserCriClient> {
    // set the WebDriver classic instance instantiated from geckodriver
    webDriverClassic = wdcInstance
    const [, browserCriClient] = await Promise.all([
      this.setupFoxdriver(foxdriverPort),
      setupCDP(remotePort, automation, onError),
    ])

    await navigateToUrlClassic(url)

    return browserCriClient
  },

  connectToNewSpec,

  navigateToUrlClassic,

  setupCDP,

  // NOTE: this is going to be removed in Cypress 14. @see https://github.com/cypress-io/cypress/issues/30222
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
}
