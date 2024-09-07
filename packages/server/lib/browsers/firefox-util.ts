import Bluebird from 'bluebird'
import Debug from 'debug'
import { CdpAutomation } from './cdp_automation'
import { BrowserCriClient } from './browser-cri-client'
import type { Automation } from '../automation'
import { GeckoDriver } from './geckodriver'
import { BidiAutomation } from './bidi/automation/bidi-automation'

const debug = Debug('cypress:server:browsers:firefox-util')

let geckoDriver: GeckoDriver

async function connectToNewTabClassic () {
  // Firefox keeps a blank tab open in versions of Firefox 123 and lower when the last tab is closed.
  // For versions 124 and above, a new tab is not created, so @packages/extension creates one for us.
  // Since the tab is always available on our behalf,
  // we can connect to it here and navigate it to about:blank to set it up for CDP connection
  const handles = await geckoDriver.getWindowHandlesWebDriverClassic()

  await geckoDriver.switchToWindowWebDriverClassic(handles[0])
}

async function connectToNewTabBiDi () {
  const currentContextHandle = await geckoDriver.bidiAutomationClient!.browsingContext.getTree()

  return currentContextHandle.contexts[0].context
}

async function connectToNewSpec (options, automation: Automation, browserCriClient: BrowserCriClient, useWebdriverBiDi: boolean) {
  debug('firefox: reconnecting to blank tab')

  let browserContext: string = ''

  if (useWebdriverBiDi) {
    browserContext = await connectToNewTabBiDi()
  } else {
    await connectToNewTabClassic()
  }

  if (browserCriClient && !useWebdriverBiDi) {
    debug('firefox: reconnecting CDP')
    await browserCriClient.currentlyAttachedTarget?.close().catch(() => {})
    const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

    await CdpAutomation.create(pageCriClient.send, pageCriClient.on, pageCriClient.off, browserCriClient.resetBrowserTargets, automation)
  }

  await options.onInitializeNewBrowserTab()

  debug(`firefox: navigating to ${options.url}`)
  if (useWebdriverBiDi) {
    await navigateToUrlBiDi(browserContext, options.url)
  } else {
    await navigateToUrlClassic(options.url)
  }
}

async function navigateToUrlClassic (url: string) {
  await geckoDriver.navigateWebdriverClassic(url)
}

async function navigateToUrlBiDi (context: string, url: string) {
  await geckoDriver.bidiAutomationClient!.browsingContext.navigate({
    context,
    url,
  })
}

async function setupCDP (remotePort, automation, onError): Promise<BrowserCriClient> {
  const browserCriClient = await BrowserCriClient.create({ hosts: ['127.0.0.1', '::1'], port: remotePort, browserName: 'Firefox', onAsynchronousError: onError, onServiceWorkerClientEvent: automation.onServiceWorkerClientEvent })
  const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

  await CdpAutomation.create(pageCriClient.send, pageCriClient.on, pageCriClient.off, browserCriClient.resetBrowserTargets, automation)

  return browserCriClient
}

export default {
  // TODO: type these args!
  async setup ({
    automation,
    extensions,
    onError,
    url,
    marionettePort,
    geckoDriverPort,
    remotePort,
    binaryPath,
    browserName,
    browserPath,
    profileRoot,
    useWebdriverBiDi,
    // @ts-expect-error
  }): Bluebird<BrowserCriClient | BidiAutomation> {
    await this.setupGeckoDriver({
      port: geckoDriverPort,
      marionettePort,
      remotePort,
      binary: binaryPath,
      profileRoot,
      browserName,
      extensions,
      useWebdriverBiDi,
      automation,
    })

    if (useWebdriverBiDi) {
      // set up BiDi remote interface
      const currentContextHandle = await connectToNewTabBiDi()

      await navigateToUrlBiDi(currentContextHandle, url)

      return geckoDriver.bidiAutomationClient!
    }

    // we are not using webdriver BiDi here, so we use CDP with classic webdriver
    if (remotePort) {
      const browserCRIClient = await setupCDP(remotePort, automation, onError)

      await navigateToUrlClassic(url)

      return browserCRIClient
    }
  },

  connectToNewSpec,

  navigateToUrlBiDi,

  setupCDP,

  async setupGeckoDriver (opts: {
    port: number
    marionettePort: number
    remotePort: number
    binary: string
    profileRoot: string
    browserName: string
    extensions: string[]
    useWebdriverBiDi: boolean
    automation: Automation
  }) {
    geckoDriver = await GeckoDriver.create({
      host: '127.0.0.1',
      port: opts.port,
      marionetteHost: '127.0.0.1',
      marionettePort: opts.marionettePort,
      remotePort: opts.remotePort,
      binary: opts.binary,
      profileRoot: opts.profileRoot,
      browserName: opts.browserName,
      extensions: opts.extensions,
      useWebdriverBiDi: opts.useWebdriverBiDi,
      automation: opts.automation,
    })

    if (opts.useWebdriverBiDi) {
      // if we are using BiDi, we need to subscribe to the modules we need to run Cypress
      await geckoDriver.bidiAutomationClient?.session.subscribe()
    }
  },
}
