import Debug from 'debug'
import { BidiAutomation } from './bidi_automation'
import type { Client as WebDriverClient } from 'webdriver'
import type { Automation } from '../automation'

const debug = Debug('cypress:server:browsers:firefox-util')

let webdriverClient: WebDriverClient

// geckodriver returns from `newSession` once the WebDriver-classic session is
// up, but the BiDi WebSocket is established asynchronously and is not always
// ready by the time we issue the first BiDi command. Retry briefly when the
// race loses.
//
// We match on the error message because webdriver.io throws a bare `Error`
// from its private `BidiHandler.sendAsync` rather than a typed class
// (`WebDriverError` etc.) with a `code` or `name` we could check, and the
// handler's `_isConnected` flag isn't exposed on the client. Revisit if
// upstream adds a typed error or a readiness API.
// @see https://github.com/webdriverio/webdriverio — `BidiHandler.sendAsync`
const BIDI_NOT_READY_MESSAGE = 'No connection to WebDriver Bidi was established'
const BIDI_SUBSCRIBE_MAX_ATTEMPTS = 10
const BIDI_SUBSCRIBE_RETRY_DELAY_MS = 200

async function subscribeToBiDiEvents (client: WebDriverClient) {
  for (let attempt = 1; attempt <= BIDI_SUBSCRIBE_MAX_ATTEMPTS; attempt++) {
    try {
      await client.sessionSubscribe({ events: BidiAutomation.BIDI_EVENTS })

      return
    } catch (err) {
      const message = (err as Error)?.message ?? ''
      const bidiNotReady = message.includes(BIDI_NOT_READY_MESSAGE)

      if (!bidiNotReady || attempt === BIDI_SUBSCRIBE_MAX_ATTEMPTS) {
        throw err
      }

      debug('BiDi connection not ready on sessionSubscribe (attempt %d/%d), retrying in %dms', attempt, BIDI_SUBSCRIBE_MAX_ATTEMPTS, BIDI_SUBSCRIBE_RETRY_DELAY_MS)
      await new Promise((resolve) => setTimeout(resolve, BIDI_SUBSCRIBE_RETRY_DELAY_MS))
    }
  }
}

async function connectToNewSpecBiDi (options, automation: Automation, browserBiDiClient: BidiAutomation) {
  debug('firefox: reconnecting to blank tab')
  const { contexts } = await webdriverClient.browsingContextGetTree({})

  browserBiDiClient.setTopLevelContextId(contexts[0].context)
  debug('registering middleware')
  // when connecting to a new spec, we need to re register the existing bidi client to the automation client
  // as the automation client resets its middleware between specs in run mode
  automation.use(browserBiDiClient.automationMiddleware)

  await options.onInitializeNewBrowserTab()

  debug(`firefox: navigating to ${options.url}`)
  await webdriverClient.browsingContextNavigate({
    context: contexts[0].context,
    url: options.url,
  })
}

async function setupBiDi (webdriverClient: WebDriverClient, automation: Automation) {
  // webdriver needs to subscribe to the correct BiDi events or else the events we are expecting to stream in will not be sent
  await subscribeToBiDiEvents(webdriverClient)

  const biDiClient = BidiAutomation.create(webdriverClient, automation)

  return biDiClient
}

export default {
  async setup ({
    automation,
    url,
    webdriverClient: wdInstance,
  }: {
    automation: Automation
    url: string
    webdriverClient: WebDriverClient
  }): Promise<BidiAutomation> {
    // set the WebDriver classic instance instantiated from geckodriver
    webdriverClient = wdInstance

    let client: BidiAutomation

    client = await setupBiDi(webdriverClient, automation)
    // use the BiDi commands to visit the url as opposed to classic webdriver
    const { contexts } = await webdriverClient.browsingContextGetTree({})

    // at this point there should only be one context: the top level context.
    // we need to set this to bind our AUT intercepts correctly. Hopefully we can move this in the future on a more sure implementation
    client.setTopLevelContextId(contexts[0].context)

    automation.use(client.automationMiddleware)

    await webdriverClient.browsingContextNavigate({
      context: contexts[0].context,
      url,
    })

    return client
  },

  connectToNewSpecBiDi,

  setupBiDi,

}
