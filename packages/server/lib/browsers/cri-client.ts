import debugModule from 'debug'

const chromeRemoteInterface = require('chrome-remote-interface')

const debugVerbose = debugModule('cy-verbose:server:browsers:cri-client')

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
  send (command: CRI.Command, params: object):Promise<any>
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
  close ():Promise<void>
}

/**
 * Creates a wrapper for Chrome remote interface client
 * that only allows to use low-level "send" method
 * and not via domain objects and commands.
 *
 * @example initCriClient('ws://localhost:...').send('Page.bringToFront')
 */
export const initCriClient = async (debuggerUrl: websocketUrl): Promise<CRIWrapper> => {
  const cri = await chromeRemoteInterface({
    target: debuggerUrl,
    local: true,
  })

  /**
   * Wrapper around Chrome remote interface client
   * that logs every command sent.
   */
  const client: CRIWrapper = {
    send (command: CRI.Command, params: object):Promise<any> {
      debugVerbose('sending %s %o', command, params)

      return cri.send(command, params)
      .then((result) => {
        debugVerbose('received response for %s: %o', command, { result })

        return result
      })
      .catch((err) => {
        debugVerbose('received error for %s: %o', command, { err })
        throw err
      })
    },

    on (eventName: CRI.EventNames, cb: Function) {
      debugVerbose('registering CDP event %s', eventName)

      return cri.on(eventName, cb)
    },

    close ():Promise<void> {
      return cri.close()
    },
  }

  return client
}
