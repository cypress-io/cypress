import CRI from 'chrome-remote-interface'
import debugModule from 'debug'
import _ from 'lodash'
import * as errors from '../errors'

import type EventEmitter from 'events'
import type WebSocket from 'ws'
import type CDP from 'chrome-remote-interface'

import type { SendDebuggerCommand, OnFn, CdpCommand, CdpEvent } from './cdp_automation'

const debug = debugModule('cypress:server:browsers:cri-client')
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = debugModule('cypress-verbose:server:browsers:cri-client:send:[-->]')
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = debugModule('cypress-verbose:server:browsers:cri-client:recv:[<--]')

const WEBSOCKET_NOT_OPEN_RE = /^WebSocket is (?:not open|already in CLOSING or CLOSED state)/

interface CDPClient extends CDP.Client {
  off: EventEmitter['off']
  _ws: WebSocket
}

export interface CriClient {
  /**
   * The target id attached to by this client
   */
  targetId: string
  /**
   * The underlying websocket connection
   */
  ws: CDPClient['_ws']
  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
   */
  send: SendDebuggerCommand
  /**
   * Registers callback for particular event.
   * @see https://github.com/cyrus-and/chrome-remote-interface#class-cdp
   */
  on: OnFn
  /**
   * Calls underlying remote interface client close
   */
  close (): Promise<void>
  /**
   * Whether this client has been closed
   */
  closed: boolean
  /**
   * Unregisters callback for particular event.
   */
  off (eventName: string, cb: (event: any) => void): void
}

const maybeDebugCdpMessages = (cri: CDPClient) => {
  if (debugVerboseReceive.enabled) {
    cri._ws.prependListener('message', (data) => {
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

export const create = async (
  target: string,
  onAsynchronousError: Function,
  host?: string,
  port?: number,
  onReconnect?: (client: CriClient) => void,
): Promise<CriClient> => {
  const subscriptions: {eventName: CdpEvent, cb: Function}[] = []
  const enableCommands: {command: CdpCommand, params: object | undefined}[] = []
  let enqueuedCommands: {command: CdpCommand, params: object | undefined, p: DeferredPromise }[] = []

  let closed = false // has the user called .close on this?
  let connected = false // is this currently connected to CDP?

  let cri: CDPClient
  let client: CriClient

  const reconnect = async () => {
    connected = false

    if (closed) {
      debug('disconnected, not reconnecting because client is closed %o', { closed, target })
      enqueuedCommands = []

      return
    }

    debug('disconnected, attempting to reconnect... %o', { closed, target })

    await connect()

    debug('restoring subscriptions + running *.enable and queued commands... %o', { subscriptions, enableCommands, enqueuedCommands, target })

    // '*.enable' commands need to be resent on reconnect or any events in
    // that namespace will no longer be received
    await Promise.all(enableCommands.map(({ command, params }) => {
      return cri.send(command, params)
    }))

    subscriptions.forEach((sub) => {
      cri.on(sub.eventName, sub.cb as any)
    })

    enqueuedCommands.forEach((cmd) => {
      cri.send(cmd.command, cmd.params).then(cmd.p.resolve as any, cmd.p.reject as any)
    })

    enqueuedCommands = []

    if (onReconnect) {
      onReconnect(client)
    }
  }

  const retryReconnect = async () => {
    debug('disconnected, starting retries to reconnect... %o', { closed, target })

    let retryIndex = 0

    const retry = async () => {
      try {
        return await reconnect()
      } catch (err) {
        if (closed) {
          debug('could not reconnect because client is closed %o', { closed, target })

          enqueuedCommands = []

          return
        }

        debug('could not reconnect, retrying... %o', { closed, target, err })

        retryIndex++

        if (retryIndex < 20) {
          await new Promise((resolve) => setTimeout(resolve, 100))

          return retry()
        }

        const cdpError = errors.get('CDP_COULD_NOT_RECONNECT', err)

        // If we cannot reconnect to CDP, we will be unable to move to the next set of specs since we use CDP to clean up and close tabs. Marking this as fatal
        cdpError.isFatalApiErr = true
        onAsynchronousError(cdpError)
      }
    }

    return retry()
  }

  const connect = async () => {
    await cri?.close()

    debug('connecting %o', { target })

    cri = await CRI({
      host,
      port,
      target,
      local: true,
      useHostName: true,
    }) as CDPClient

    connected = true

    maybeDebugCdpMessages(cri)

    // Only reconnect when we're not running cypress in cypress. There are a lot of disconnects that happen that we don't want to reconnect on
    if (!process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
      cri.on('disconnect', retryReconnect)
    }
  }

  await connect()

  client = {
    targetId: target,

    async send (command: CdpCommand, params?: object) {
      const enqueue = () => {
        return new Promise((resolve, reject) => {
          enqueuedCommands.push({ command, params, p: { resolve, reject } })
        })
      }

      // Keep track of '*.enable' commands so they can be resent when
      // reconnecting
      if (command.endsWith('.enable') || ['Runtime.addBinding', 'Target.setDiscoverTargets'].includes(command)) {
        enableCommands.push({ command, params })
      }

      if (connected) {
        try {
          return await cri.send(command, params)
        } catch (err) {
          // This error occurs when the browser has been left open for a long
          // time and/or the user's computer has been put to sleep. The
          // socket disconnects and we need to recreate the socket and
          // connection
          if (!WEBSOCKET_NOT_OPEN_RE.test(err.message)) {
            throw err
          }

          debug('encountered closed websocket on send %o', { command, params, err })

          const p = enqueue() as Promise<any>

          await retryReconnect()

          // if enqueued commands were wiped out from the reconnect and the socket is already closed, reject the command as it will never be run
          if (enqueuedCommands.length === 0 && closed) {
            debug('connection was closed was trying to reconnect')

            return Promise.reject(new Error(`${command} will not run as browser CRI connection was reset`))
          }

          return p
        }
      }

      return enqueue()
    },

    on (eventName, cb) {
      subscriptions.push({ eventName, cb })
      debug('registering CDP on event %o', { eventName })

      return cri.on(eventName, cb)
    },

    off (eventName, cb) {
      subscriptions.splice(subscriptions.findIndex((sub) => {
        return sub.eventName === eventName && sub.cb === cb
      }), 1)

      return cri.off(eventName, cb)
    },

    get ws () {
      return cri._ws
    },

    get closed () {
      return closed
    },

    async close () {
      if (closed) {
        debug('not closing, cri client is already closed %o', { closed, target })

        return
      }

      debug('closing cri client %o', { closed, target })

      closed = true

      return cri.close()
      .finally(() => {
        debug('closed cri client %o', { closed, target })
      })
    },
  }

  return client
}
