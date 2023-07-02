import debugModule from 'debug'
import _ from 'lodash'
import CRI from 'chrome-remote-interface'
import * as errors from '../errors'
import type { CdpCommand, CdpEvent } from './cdp_automation'

const debug = debugModule('cypress:server:browsers:cri-client')
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = debugModule('cypress-verbose:server:browsers:cri-client:send:[-->]')
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = debugModule('cypress-verbose:server:browsers:cri-client:recv:[<--]')

const WEBSOCKET_NOT_OPEN_RE = /^WebSocket is (?:not open|already in CLOSING or CLOSED state)/

export interface CriClient {
  /**
   * The target id attached to by this client
   */
  targetId: string
  /**
   * Sends a command to the Chrome remote interface.
   * @example client.send('Page.navigate', { url })
   */
  send (command: CdpCommand, params?: object): Promise<any>
  /**
   * Registers callback for particular event.
   * @see https://github.com/cyrus-and/chrome-remote-interface#class-cdp
   */
  on (eventName: CdpEvent, cb: Function): void
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

export const create = async (target: string, onAsynchronousError: Function, host?: string, port?: number, onReconnect?: (client: CriClient) => void): Promise<CriClient> => {
  const subscriptions: {eventName: CdpEvent, cb: Function}[] = []
  const enableCommands: CdpCommand[] = []
  let enqueuedCommands: {command: CdpCommand, params: any, p: DeferredPromise }[] = []

  let closed = false // has the user called .close on this?
  let connected = false // is this currently connected to CDP?

  let cri
  let client: CriClient

  const reconnect = async () => {
    debug('disconnected, attempting to reconnect... %o', { closed })

    connected = false

    if (closed) {
      enqueuedCommands = []

      return
    }

    try {
      await connect()

      debug('restoring subscriptions + running *.enable and queued commands... %o', { subscriptions, enableCommands, enqueuedCommands })

      // '*.enable' commands need to be resent on reconnect or any events in
      // that namespace will no longer be received
      await Promise.all(enableCommands.map((cmdName) => {
        return cri.send(cmdName)
      }))

      subscriptions.forEach((sub) => {
        cri.on(sub.eventName, sub.cb)
      })

      enqueuedCommands.forEach((cmd) => {
        cri.send(cmd.command, cmd.params)
        .then(cmd.p.resolve, cmd.p.reject)
      })

      enqueuedCommands = []

      if (onReconnect) {
        onReconnect(client)
      }
    } catch (err) {
      const cdpError = errors.get('CDP_COULD_NOT_RECONNECT', err)

      // If we cannot reconnect to CDP, we will be unable to move to the next set of specs since we use CDP to clean up and close tabs. Marking this as fatal
      cdpError.isFatalApiErr = true
      onAsynchronousError(cdpError)
    }
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
    })

    connected = true

    maybeDebugCdpMessages(cri)

    // @see https://github.com/cyrus-and/chrome-remote-interface/issues/72
    cri._notifier.on('disconnect', reconnect)
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
      if (command.endsWith('.enable')) {
        enableCommands.push(command)
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

          const p = enqueue()

          await reconnect()

          // if enqueued commands were wiped out from the reconnect and the socket is already closed, reject the command as it will never be run
          if (enqueuedCommands.length === 0 && closed) {
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
    close () {
      closed = true

      return cri.close()
    },
  }

  return client
}
