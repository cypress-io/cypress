const chromeRemoteInterface = require('chrome-remote-interface')
const errors = require('../errors')

/**
 * Url returned by the Chrome Remote Interface
*/
type websocketUrl = string

namespace CRI {
  export type Command =
    'Browser.getVersion' |
    'Page.bringToFront' |
    'Page.captureScreenshot' |
    'Page.navigate' |
    'Page.startScreencast'

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
   * Get the `protocolVersion` supported by the browser.
   */
  getProtocolVersion (): Promise<string>
  /**
   * Rejects if `protocolVersion` is less than the current version.
   * @param protocolVersion CDP version string (ex: 1.3)
   */
  ensureMinimumProtocolVersion(protocolVersion: string): Promise<void>
  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
  */
  send (command: CRI.Command, params?: object):Promise<any>
  /**
   * Resolves with a base64 data URI screenshot.
   */
  takeScreenshot(): Promise<string>
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

  let cachedProtocolVersionP

  const ensureMinimumProtocolVersion = (protocolVersion: string) : Promise<void> => {
    return getProtocolVersion()
    .then((actual) => {
      const minimum = getMajorMinorVersion(protocolVersion)

      const hasVersion = actual.major > minimum.major
         || (actual.major === minimum.major && actual.minor >= minimum.minor)

      if (!hasVersion) {
        errors.throw('CDP_VERSION_TOO_OLD', protocolVersion, actual)
      }
    })
  }

  const getMajorMinorVersion = (version: string) => {
    const [major, minor] = version.split('.', 2).map(Number)

    return { major, minor }
  }

  const getProtocolVersion = () => {
    if (!cachedProtocolVersionP) {
      cachedProtocolVersionP = cri.send('Browser.getVersion')
      .catch(() => {
        // could be any version <= 1.2
        return { protocolVersion: '0.0' }
      })
      .then(({ protocolVersion }) => {
        return getMajorMinorVersion(protocolVersion)
      })
    }

    return cachedProtocolVersionP
  }

  const client: CRIWrapper = {
    ensureMinimumProtocolVersion,
    getProtocolVersion,
    send: (command: CRI.Command, params?: object):Promise<any> => {
      return cri.send(command, params)
    },
    takeScreenshot: () => {
      return ensureMinimumProtocolVersion('1.3')
      .catch((err) => {
        throw new Error(`takeScreenshot requires at least Chrome 64.\n\nDetails:\n${err.message}`)
      }).then(() => {
        return client.send('Page.captureScreenshot')
      }).then(({ data }) => {
        return `data:image/png;base64,${data}`
      })
    },
    Page: cri.Page,
  }

  return client
}
