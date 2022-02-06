import Bluebird from 'bluebird'
import debugModule from 'debug'
import _ from 'lodash'
import CRI from 'chrome-remote-interface'
import errors from '../errors'

const debug = debugModule('cypress:server:browsers:cri-client')
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = debugModule('cypress-verbose:server:browsers:cri-client:send:[-->]')
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = debugModule('cypress-verbose:server:browsers:cri-client:recv:[<--]')

const WEBSOCKET_NOT_OPEN_RE = /^WebSocket is (?:not open|already in CLOSING or CLOSED state)/

/**
 * Wrapper for Chrome Remote Interface client. Only allows "send" method.
 * @see https://github.com/cyrus-and/chrome-remote-interface#clientsendmethod-params-callback
*/
interface CRIWrapper {
  targetId: string
  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
  */
  send (command: CRI.Command, params?: object): Bluebird<any>
  /**
   * Registers callback for particular event.
   * @see https://github.com/cyrus-and/chrome-remote-interface#class-cdp
   */
  on (eventName: CRI.Event, cb: Function): void
  /**
   * Calls underlying remote interface client close
  */
  close (): Bluebird<void>
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

type DeferredPromise = { resolve: Function, reject: Function }

export const create = (target: string, host: string, port: number, onAsynchronousError: Function): Promise<CRIWrapper> => {
  const subscriptions: {eventName: CRI.Event, cb: Function}[] = []
  let enqueuedCommands: {command: CRI.Command, params: any, p: DeferredPromise }[] = []

  let closed = false // has the user called .close on this?
  let connected = false // is this currently connected to CDP?

  let cri
  let client: CRIWrapper

  const reconnect = () => {
    debug('disconnected, attempting to reconnect... %o', { closed })

    connected = false

    if (closed) {
      enqueuedCommands = []

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
      const cdpError = errors.get('CDP_COULD_NOT_RECONNECT', err)

      // If we cannot reconnect to CDP, we will be unable to move to the next set of specs since we use CDP to clean up and close tabs. Marking this as fatal
      cdpError.isFatalApiErr = true
      onAsynchronousError(cdpError)
    })
  }

  const connect = () => {
    cri?.close()

    debug('connecting %o', { target })

    return CRI({
      host,
      port,
      target,
      local: true,
    })
    .then((newCri) => {
      cri = newCri
      connected = true

      maybeDebugCdpMessages(cri)

      cri.send = Bluebird.promisify(cri.send, { context: cri })

      // @see https://github.com/cyrus-and/chrome-remote-interface/issues/72
      cri._notifier.on('disconnect', reconnect)
    })
  }

  return connect()
  .then(() => {
    client = {
      targetId: target,
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
      on (eventName: CRI.Event, cb: Function) {
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
}
