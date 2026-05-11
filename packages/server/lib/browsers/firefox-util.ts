import Debug from 'debug'
import { BidiAutomation } from './bidi_automation'
import type { BidiHandler, Client as WebDriverClient } from 'webdriver'
import type { Automation } from '../automation'

type ClientWithBidiHandler = WebDriverClient & { _bidiHandler?: BidiHandler }

const debug = Debug('cypress:server:browsers:firefox-util')

let webdriverClient: WebDriverClient

// The BiDi WebSocket opens asynchronously after geckodriver returns, so
// any BiDi command issued before it's ready will fail. Wait for the
// connection before proceeding.
async function awaitBiDiConnection (client: WebDriverClient) {
  const handler = (client as ClientWithBidiHandler)._bidiHandler

  if (!handler) {
    throw new Error('WebDriver BiDi handler is not available on the client')
  }

  const connected = await handler.waitForConnected()

  debug('BiDi connection established: %s', connected)
  if (!connected) {
    throw new Error('WebDriver BiDi connection failed to establish')
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
  // wait for the BiDi WebSocket to be established before issuing any BiDi
  // commands; otherwise the first one races geckodriver's async connect
  await awaitBiDiConnection(webdriverClient)
  // webdriver needs to subscribe to the correct BiDi events or else the events we are expecting to stream in will not be sent
  await webdriverClient.sessionSubscribe({ events: BidiAutomation.BIDI_EVENTS })

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
