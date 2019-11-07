import Bluebird from 'bluebird'
import debugModule from 'debug'
import _ from 'lodash'

const chromeRemoteInterface = require('chrome-remote-interface')
const errors = require('../errors')

const debugVerbose = debugModule('cypress-verbose:server:browsers:cri-client')
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = debugModule('cypress-verbose:server:browsers:cri-client:send:[-->]')
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = debugModule('cypress-verbose:server:browsers:cri-client:recv:[<--]')

/**
 * Url returned by the Chrome Remote Interface
*/
type websocketUrl = string

/**
 * Enumerations to make programming CDP slightly simpler - provides
 * IntelliSense whenever you use named types.
 */
namespace CRI {
  export type Command =
    'Browser.getVersion' |
    'Page.bringToFront' |
    'Page.captureScreenshot' |
    'Page.navigate' |
    'Page.startScreencast'

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
   * Get the `protocolVersion` supported by the browser.
   */
  getProtocolVersion (): Bluebird<string>
  /**
   * Rejects if `protocolVersion` is less than the current version.
   * @param protocolVersion CDP version string (ex: 1.3)
   */
  ensureMinimumProtocolVersion(protocolVersion: string): Bluebird<void>
  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
  */
  send (command: CRI.Command, params?: object): Bluebird<any>
  /**
   * Registers callback for particular event.
   * @see https://github.com/cyrus-and/chrome-remote-interface#class-cdp
   */
  on (eventName: CRI.EventNames, cb: Function): void
  /**
   * Calls underlying remote interface client close
  */
  close (): Bluebird<void>
}

interface Version {
  major: number
  minor: number
}

const isVersionGte = (a: Version, b: Version) => {
  return a.major > b.major || (a.major === b.major && a.minor >= b.minor)
}

const getMajorMinorVersion = (version: string): Version => {
  const [major, minor] = version.split('.', 2).map(Number)

  return { major, minor }
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

export const create = Bluebird.method((debuggerUrl: websocketUrl): Bluebird<CRIWrapper> => {
  return chromeRemoteInterface({
    target: debuggerUrl,
    local: true,
  })
  .then((cri) => {
    maybeDebugCdpMessages(cri)

    cri.send = Bluebird.promisify(cri.send, { context: cri })
    cri.close = Bluebird.promisify(cri.close, { context: cri })

    const ensureMinimumProtocolVersion = (protocolVersion: string) => {
      return getProtocolVersion()
      .then((actual) => {
        const minimum = getMajorMinorVersion(protocolVersion)

        if (!isVersionGte(actual, minimum)) {
          errors.throw('CDP_VERSION_TOO_OLD', protocolVersion, actual)
        }
      })
    }

    const getProtocolVersion = _.memoize(() => {
      return cri.send('Browser.getVersion')
      // could be any version <= 1.2
      .catchReturn({ protocolVersion: '0.0' })
      .then(({ protocolVersion }) => {
        return getMajorMinorVersion(protocolVersion)
      })
    })

    /**
   * Wrapper around Chrome remote interface client
   * that logs every command sent.
   */
    const client: CRIWrapper = {
      ensureMinimumProtocolVersion,
      getProtocolVersion,
      send: Bluebird.method((command: CRI.Command, params?: object) => {
        return cri.send(command, params)
      }),
      on (eventName: CRI.EventNames, cb: Function) {
        debugVerbose('registering CDP on event %o', { eventName })

        return cri.on(eventName, cb)
      },
      close () {
        return cri.close()
      },
    }

    return client
  })
})
