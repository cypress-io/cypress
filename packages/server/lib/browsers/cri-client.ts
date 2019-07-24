const chromeRemoteInterface = require('chrome-remote-interface')

/**
 * Url returned by the Chrome Remote Interface
*/
type websocketUrl = string

namespace CRI {
  export enum Command {
    'Page.bringToFront',
    'Page.navigate',
    'Page.startScreencast'
  }

  export interface Page {
    screencastFrame(cb)
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
  Page: CRI.Page
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

  const client: CRIWrapper = {
    send: (command: CRI.Command, params: object):Promise<any> => {
      return cri.send(command, params)
    },
    Page: cri.Page,
  }

  return client
}
