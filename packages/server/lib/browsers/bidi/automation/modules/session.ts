import debugModule from 'debug'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { AbstractModule } from './abstract-module'

const debug = debugModule('cypress:server:browsers:bidi:automation:modules:session')

export enum SubscriptionEvents {
  BROWSING_CONTEXT = 'browsingContext',
  INPUT = 'input',
  NETWORK = 'network',
  LOG = 'log',
  SCRIPT = 'script',
  STORAGE = 'storage'
}

export class SessionModule extends AbstractModule {
  /**
   * allows creating a new BiDi session.
   * @see https://w3c.github.io/webdriver-bidi/#command-session-new
   * @param {Bidi.Session.CapabilitiesRequest} capabilities - The capabilities needed to start the session
   * @returns {Bidi.Session.NewResult} the results of the created session
   */
  async new (capabilities: Bidi.Session.CapabilitiesRequest = {}): Promise<Bidi.Session.NewResult> {
    const payload: Bidi.Session.New = {
      method: 'session.new',
      params: {
        capabilities: {
          firstMatch: capabilities?.firstMatch,
          alwaysMatch: {
            ...capabilities,
          },
        },
      },
    }

    try {
      const session = await this._bidiSocket.sendCommand<Bidi.Session.New, Bidi.Session.NewResult>(payload)

      return session
    } catch (e) {
      debug(`failed to create new session: ${e}`)
      throw e
    }
  }

  /**
   * returns information about whether a remote end is in a state in which it can create new sessions, but may additionally include arbitrary meta information that is specific to the implementation.
   * @see https://w3c.github.io/webdriver-bidi/#command-session-status
   * @returns {Bidi.Session.StatusResult} the session status details
   */
  async status (): Promise<Bidi.Session.StatusResult> {
    const payload: Bidi.Session.Status = {
      method: 'session.status',
      params: {},
    }

    try {
      const statusResult = await this._bidiSocket.sendCommand<Bidi.Session.Status, Bidi.Session.StatusResult>(payload)

      return statusResult
    } catch (e) {
      debug(`failed to get session status: ${e}`)
      throw e
    }
  }

  /**
   * ends the current session
   * @see https://w3c.github.io/webdriver-bidi/#command-session-end
   * @returns {undefined}
   */
  async end (): Promise<void> {
    const payload: Bidi.Session.End = {
      method: 'session.end',
      params: {},
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.Session.End, void>(payload)
      // TODO: do we close the websocket as well?
    } catch (e) {
      debug(`failed to end session: ${e}`)
      throw e
    }

    return
  }

  /**
   *  enables certain events either globally or for a set of navigables
   * @see https://w3c.github.io/webdriver-bidi/#command-session-subscribe
   * @param {SubscriptionEvents[]} events - events to subscribe to in the session
   * @returns {undefined}
   */
  async subscribe (events: SubscriptionEvents[] = [SubscriptionEvents.BROWSING_CONTEXT, SubscriptionEvents.INPUT, SubscriptionEvents.LOG, SubscriptionEvents.NETWORK, SubscriptionEvents.SCRIPT, SubscriptionEvents.STORAGE]) {
    const payload: Bidi.Session.Subscribe = {
      method: 'session.subscribe',
      params: {
        events: events as [string, ...string[]],
      },
    }

    try {
      await this._bidiSocket.sendCommand<Bidi.Session.Subscribe, void>(payload)
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
  async unsubscribe (events: SubscriptionEvents[] = [SubscriptionEvents.BROWSING_CONTEXT, SubscriptionEvents.INPUT, SubscriptionEvents.LOG, SubscriptionEvents.NETWORK, SubscriptionEvents.SCRIPT, SubscriptionEvents.STORAGE]) {
    const payload: Bidi.Session.Unsubscribe = {
      method: 'session.unsubscribe',
      params: {
        events: events as [string, ...string[]],
      },
    }

    try {
      await this._bidiSocket.sendCommand(payload)
    } catch (e) {
      debug(`failed to unsubscribe to session: ${e}`)
      throw e
    }

    return
  }
}
