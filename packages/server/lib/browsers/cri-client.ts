import debugModule from 'debug'
import _ from 'lodash'

const chromeRemoteInterface = require('chrome-remote-interface')
const debugVerbose = debugModule('cypress-verbose:server:browsers:cri-client')
const debugVerboseSend = debugModule('cypress-verbose:server:browsers:cri-client:[-->]')
const debugVerboseReceive = debugModule('cypress-verbose:server:browsers:cri-client:[<--]')

/**
 * Url returned by the Chrome Remote Interface
*/
type websocketUrl = string

/**
 * Enumerations to make programming CDP slightly simpler - provides
 * IntelliSense whenever you use named types.
 */
namespace CRI {
  export enum Command {
    'Page.bringToFront',
    'Page.navigate',
    'Page.startScreencast'
  }

  export enum EventNames {
    'Page.screencastFrame'
  }
}

/**
 * Wrapper for Chrome Remote Interface client. Only allows "send" method.
 * @see https://github.com/cyrus-and/chrome-remote-interface#clientsendmethod-params-callback
*/
interface CRIWrapper {
  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
  */
  send (command: CRI.Command, params: object): Promise<any>
  /**
   * Exposes Chrome remote interface Page domain,
   * buton only for certain actions that are hard to do using "send"
   *
   * @example client.Page.screencastFrame(cb)
  */

  /**
   * Registers callback for particular event.
   * @see https://github.com/cyrus-and/chrome-remote-interface#class-cdp
   */
  on (eventName: CRI.EventNames, cb: Function): void

  /**
   * Calls underlying remote interface client close
  */
  close (): Promise<void>
}

const maybeDebugCdpMessages = (cri) => {
  if (debugVerboseReceive.enabled) {
    cri._ws.on('message', (data) => {
      data = _
      .chain(JSON.parse(data))
      .tap((data) => {
        const str = _.get(data, 'params.data')

        if (!_.isString(str)) {
          return
        }

        data.params.data = _.truncate(str, {
          length: 100,
          omission: `... [truncated string of total bytes: ${str.length}]`,
        })

        return data
      })
      .value()

      debugVerboseReceive('received CDP message %o', data)
    })

  }

  if (debugVerboseSend.enabled) {
    const send = cri._ws.send

    cri._ws.send = (data, callback) => {
      debugVerboseSend('sending CDP command %o', JSON.parse(data))

      return send.call(cri._ws, data, callback)
    }
  }
}

/**
 * Creates a wrapper for Chrome remote interface client
 * that only allows to use low-level "send" method
 * and not via domain objects and commands.
 *
 * @example create('ws://localhost:...').send('Page.bringToFront')
 */
export { chromeRemoteInterface }

export const create = async (debuggerUrl: websocketUrl): Promise<CRIWrapper> => {
  const cri = await chromeRemoteInterface({
    target: debuggerUrl,
    local: true,
  })

  maybeDebugCdpMessages(cri)

  /**
   * Wrapper around Chrome remote interface client
   * that logs every command sent.
   */
  const client: CRIWrapper = {
    send (command: CRI.Command, params: object): Promise<any> {
      return cri.send(command, params)
    },

    on (eventName: CRI.EventNames, cb: Function) {
      debugVerbose('registering CDP on event %o', { eventName })

      return cri.on(eventName, cb)
    },

    close (): Promise<void> {
      return cri.close()
    },
  }

  return client
}
