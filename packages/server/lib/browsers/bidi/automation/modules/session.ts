import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { WebdriverBidiModule } from './abstract-module'

const debug = debugModule('cypress:server:browsers:bidi:automation:modules:session')

export enum SubscriptionEvents {
  BROWSING_CONTEXT = 'browsingContext',
  INPUT = 'input',
  NETWORK = 'network',
  LOG = 'log',
  SCRIPT = 'script',
  STORAGE = 'storage'
}

export class SessionModule extends WebdriverBidiModule {
  /**
   * start a given Webdriver BiDi session
   * @param {Bidi.Session.CapabilitiesRequest} capabilities - The capabilities needed to start the session
   * @returns {Bidi.Session.NewResult} the results of the created session
   */
  async newSession (capabilities: Bidi.Session.CapabilitiesRequest = {}): Promise<Bidi.Session.NewResult> {
    const method = 'session.new'
    const params = {
      capabilities: {
        firstMatch: capabilities?.firstMatch,
        alwaysMatch: {
          ...capabilities,
        },
      },
    }
    const payload: Bidi.Session.New = {
      method,
      params,
    }

    try {
      const session = await this._bidiSocket.request<Bidi.Session.New, Bidi.Session.NewResult>(payload)

      return session
    } catch (e) {
      debug(`failed to create new session: ${e}`)
      throw e
    }
  }

  /**
   * end a given Webdriver BiDi session
   * @see https://w3c.github.io/webdriver-bidi/#command-session-end
   * @returns {undefined}
   */
  async endSession (): Promise<void> {
    const method = 'session.end'
    const params = {}
    const payload: Bidi.Session.End = {
      method,
      params,
    }

    try {
      await this._bidiSocket.request<Bidi.Session.End, void>(payload)
      // TODO: do we close the websocket as well?
    } catch (e) {
      debug(`failed to end session: ${e}`)
      throw e
    }

    return
  }

  /**
   * subscribes to Webdriver BiDi modules in a given session
   * @see https://w3c.github.io/webdriver-bidi/#command-session-subscribe
   * @param {SubscriptionEvents[]} events - events to subscribe to in the session
   * @returns {undefined}
   */
  async subscribeSession (events: SubscriptionEvents[] = [SubscriptionEvents.BROWSING_CONTEXT, SubscriptionEvents.INPUT, SubscriptionEvents.LOG, SubscriptionEvents.NETWORK, SubscriptionEvents.SCRIPT, SubscriptionEvents.STORAGE]) {
    const method = 'session.subscribe'
    const params = {
      events: events as [string, ...string[]],
    }
    const payload: Bidi.Session.Subscribe = {
      method,
      params,
    }

    try {
      await this._bidiSocket.request<Bidi.Session.Subscribe, void>(payload)
    } catch (e) {
      debug(`failed to subscribe to session: ${e}`)
      throw e
    }
  }

  /**
   * unsubscribes to Webdriver BiDi modules in a given session
   * @see https://w3c.github.io/webdriver-bidi/#command-session-unsubscribe
   * @param {SubscriptionEvents[]} events - events to unsubscribe to in the session
   * @returns {undefined}
   */
  async unsubscribeSession (events: SubscriptionEvents[] = [SubscriptionEvents.BROWSING_CONTEXT, SubscriptionEvents.INPUT, SubscriptionEvents.LOG, SubscriptionEvents.NETWORK, SubscriptionEvents.SCRIPT, SubscriptionEvents.STORAGE]) {
    const method = 'session.unsubscribe'
    const params = {
      events: events as [string, ...string[]],
    }
    const payload: Bidi.Session.Unsubscribe = {
      method,
      params,
    }

    try {
      await this._bidiSocket.request(payload)
    } catch (e) {
      debug(`failed to unsubscribe to session: ${e}`)
      throw e
    }

    return
  }
}
