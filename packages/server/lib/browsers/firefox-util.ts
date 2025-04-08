import Debug from 'debug'
import { BidiAutomation } from './bidi_automation'
import type { Client as WebDriverClient } from 'webdriver'
import type { Automation } from '../automation'

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

async function setupBiDi (webdriverClient: WebDriverClient, automation: Automation) {
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
