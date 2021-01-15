import Bluebird from 'bluebird'
import debugModule from 'debug'
import _ from 'lodash'

const chromeRemoteInterface = require('chrome-remote-interface')
const errors = require('../errors')

const debug = debugModule('cypress:server:browsers:cri-client')
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = debugModule('cypress-verbose:server:browsers:cri-client:send:[-->]')
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = debugModule('cypress-verbose:server:browsers:cri-client:recv:[<--]')

const WEBSOCKET_NOT_OPEN_RE = /^WebSocket is (?:not open|already in CLOSING or CLOSED state)/

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
    'Page.startScreencast' |
    'Page.screencastFrameAck'

  export type EventName =
    'Page.screencastFrame'
}

/**
 * Wrapper for Chrome Remote Interface client. Only allows "send" method.
 * @see https://github.com/cyrus-and/chrome-remote-interface#clientsendmethod-params-callback
*/
interface CRIWrapper {
  /**
   * Get the `protocolVersion` supported by the browser.
   */
  getProtocolVersion (): Bluebird<Version>
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
  on (eventName: CRI.EventName, cb: Function): void
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
        ([
          'params.data', // screencast frame data
          'result.data', // screenshot data
        ]).forEach((truncatablePath) => {
          const str = _.get(data, truncatablePath)

          if (!_.isString(str)) {
            return
          }

          _.set(data, truncatablePath, _.truncate(str, {
            length: 100,
            omission: `... [truncated string of total bytes: ${str.length}]`,
          }))
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

type DeferredPromise = { resolve: Function, reject: Function }

export const create = Bluebird.method((target: websocketUrl, onAsynchronousError: Function): Bluebird<CRIWrapper> => {
  const subscriptions: {eventName: CRI.EventName, cb: Function}[] = []
  let enqueuedCommands: {command: CRI.Command, params: any, p: DeferredPromise }[] = []

  let closed = false // has the user called .close on this?
  let connected = false // is this currently connected to CDP?

  let cri
  let client: CRIWrapper

  const reconnect = () => {
    debug('disconnected, attempting to reconnect... %o', { closed })

    connected = false

    if (closed) {
      return
    }

    return connect()
    .then(() => {
      debug('restoring subscriptions + running queued commands... %o', { subscriptions, enqueuedCommands })
      subscriptions.forEach((sub) => {
        cri.on(sub.eventName, sub.cb)
      })

      enqueuedCommands.forEach((cmd) => {
        cri.send(cmd.command, cmd.params)
        .then(cmd.p.resolve, cmd.p.reject)
      })

      enqueuedCommands = []
    })
    .catch((err) => {
      onAsynchronousError(errors.get('CDP_COULD_NOT_RECONNECT', err))
    })
  }

  const connect = () => {
    cri?.close()

    debug('connecting %o', { target })

    return chromeRemoteInterface({
      target,
      local: true,
    })
    .then((newCri) => {
      cri = newCri
      connected = true

      maybeDebugCdpMessages(cri)

      cri.send = Bluebird.promisify(cri.send, { context: cri })
      cri.close = Bluebird.promisify(cri.close, { context: cri })

      // @see https://github.com/cyrus-and/chrome-remote-interface/issues/72
      cri._notifier.on('disconnect', reconnect)
    })
  }

  return connect()
  .then(() => {
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
      return client.send('Browser.getVersion')
      // could be any version <= 1.2
      .catchReturn({ protocolVersion: '0.0' })
      .then(({ protocolVersion }) => {
        return getMajorMinorVersion(protocolVersion)
      })
    })

    client = {
      ensureMinimumProtocolVersion,
      getProtocolVersion,
      send: Bluebird.method((command: CRI.Command, params?: object) => {
        const enqueue = () => {
          return new Bluebird((resolve, reject) => {
            enqueuedCommands.push({ command, params, p: { resolve, reject } })
          })
        }

        if (connected) {
          return cri.send(command, params)
          .catch((err) => {
            if (!WEBSOCKET_NOT_OPEN_RE.test(err.message)) {
              throw err
            }

            debug('encountered closed websocket on send %o', { command, params, err })

            const p = enqueue()

            reconnect()

            return p
          })
        }

        return enqueue()
      }),
      on (eventName: CRI.EventName, cb: Function) {
        subscriptions.push({ eventName, cb })
        debug('registering CDP on event %o', { eventName })

        return cri.on(eventName, cb)
      },
      close () {
        closed = true

        return cri.close()
      },
    }

    return client
  })
})
