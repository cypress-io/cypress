import Debug from 'debug'
import { CdpAutomation } from './cdp_automation'
import { BidiAutomation } from './bidi_automation'
import { BrowserCriClient } from './browser-cri-client'
import type { Client as WebDriverClient } from 'webdriver'
import type { Automation } from '../automation'
import type { CypressError } from '@packages/errors'

const debug = Debug('cypress:server:browsers:firefox-util')

let webdriverClient: WebDriverClient

async function connectToNewSpecBiDi (options, automation: Automation, browserBiDiClient: BidiAutomation) {
  // when connecting to a new spec, we need to re register the existing bidi client to the automation client
  // as the automation client resets its middleware between specs in run mode
  debug('firefox: reconnecting to blank tab')
  const { contexts } = await webdriverClient.browsingContextGetTree({})

  browserBiDiClient.setTopLevelContextId(contexts[0].context)

  await options.onInitializeNewBrowserTab()

  debug(`firefox: navigating to ${options.url}`)
  await webdriverClient.browsingContextNavigate({
    context: contexts[0].context,
    url: options.url,
  })
}

async function connectToNewSpecCDP (options, automation: Automation, browserCriClient: BrowserCriClient) {
  debug('firefox: reconnecting to blank tab')

  // Firefox keeps a blank tab open in versions of Firefox 123 and lower when the last tab is closed.
  // For versions 124 and above, a new tab is not created, so @packages/extension creates one for us.
  // Since the tab is always available on our behalf,
  // we can connect to it here and navigate it to about:blank to set it up for CDP connection
  const handles = await webdriverClient.getWindowHandles()

  await webdriverClient.switchToWindow(handles[0])

  await webdriverClient.navigateTo('about:blank')

  debug('firefox: reconnecting CDP')

  if (browserCriClient) {
    await browserCriClient.currentlyAttachedTarget?.close().catch(() => {})
    const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

    await CdpAutomation.create(pageCriClient.send, pageCriClient.on, pageCriClient.off, browserCriClient.resetBrowserTargets, automation)
  }

  await options.onInitializeNewBrowserTab()

  debug(`firefox: navigating to ${options.url}`)
  await webdriverClient.navigateTo(options.url)
}

async function setupBiDi (webdriverClient: WebDriverClient, automation: Automation) {
  // webdriver needs to subscribe to the correct BiDi events or else the events we are expecting to stream in will not be sent
  await webdriverClient.sessionSubscribe({ events: BidiAutomation.BIDI_EVENTS })

  const biDiClient = BidiAutomation.create(webdriverClient, automation)

  return biDiClient
}

async function setupCDP (remotePort: number, automation: Automation, onError?: (err: Error) => void): Promise<BrowserCriClient> {
  const browserCriClient = await BrowserCriClient.create({ hosts: ['127.0.0.1', '::1'], port: remotePort, browserName: 'Firefox', onAsynchronousError: onError as (err: CypressError) => void, onServiceWorkerClientEvent: automation.onServiceWorkerClientEvent })
  const pageCriClient = await browserCriClient.attachToTargetUrl('about:blank')

  await CdpAutomation.create(pageCriClient.send, pageCriClient.on, pageCriClient.off, browserCriClient.resetBrowserTargets, automation)

  return browserCriClient
}

export default {
  async setup ({
    automation,
    onError,
    url,
    remotePort,
    webdriverClient: wdInstance,
    useWebDriverBiDi,
  }: {
    automation: Automation
    onError?: (err: Error) => void
    url: string
    remotePort: number | undefined
    webdriverClient: WebDriverClient
    useWebDriverBiDi: boolean
  }): Promise<BrowserCriClient | BidiAutomation> {
    // set the WebDriver classic instance instantiated from geckodriver
    webdriverClient = wdInstance

    let client: BrowserCriClient | BidiAutomation

    if (useWebDriverBiDi) {
      client = await setupBiDi(webdriverClient, automation)
      // use the BiDi commands to visit the url as opposed to classic webdriver
      const { contexts } = await webdriverClient.browsingContextGetTree({})

      // at this point there should only be one context: the top level context.
      // we need to set this to bind our AUT intercepts correctly. Hopefully we can move this in the future on a more sure implementation
      client.setTopLevelContextId(contexts[0].context)

      await webdriverClient.browsingContextNavigate({
        context: contexts[0].context,
        url,
      })
    } else {
      client = await setupCDP(remotePort as number, automation, onError)
      // uses webdriver classic to navigate
      await webdriverClient.navigateTo(url)
    }

    return client
  },

  connectToNewSpecBiDi,

  connectToNewSpecCDP,

  setupBiDi,

  setupCDP,
}
