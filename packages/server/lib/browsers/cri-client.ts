import CRI from 'chrome-remote-interface'
import debugModule from 'debug'
import _ from 'lodash'
import * as errors from '../errors'

import type EventEmitter from 'events'
import type WebSocket from 'ws'
import type CDP from 'chrome-remote-interface'

import type { SendDebuggerCommand, OnFn, CdpCommand, CdpEvent } from './cdp_automation'
import type { ProtocolManagerShape } from '@packages/types'

const debug = debugModule('cypress:server:browsers:cri-client')
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = debugModule('cypress-verbose:server:browsers:cri-client:send:[-->]')
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = debugModule('cypress-verbose:server:browsers:cri-client:recv:[<--]')

const WEBSOCKET_NOT_OPEN_RE = /^WebSocket is (?:not open|already in CLOSING or CLOSED state)/

type QueuedMessages = {
  enableCommands: EnableCommand[]
  enqueuedCommands: EnqueuedCommand[]
  subscriptions: Subscription[]
}

type EnqueuedCommand = {
  command: CdpCommand
  params?: object
  p: DeferredPromise
  sessionId?: string
}

type EnableCommand = {
  command: CdpCommand
  params?: object
  sessionId?: string
}

type Subscription = {
  eventName: CdpEvent
  cb: Function
}

interface CDPClient extends CDP.Client {
  off: EventEmitter['off']
  _ws: WebSocket
}

export const DEFAULT_NETWORK_ENABLE_OPTIONS = {
  maxTotalBufferSize: 0,
  maxResourceBufferSize: 0,
  maxPostDataSize: 0,
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

  onReconnectAttempt? (retryIndex: number): void

  /**
   * The internal queue of replayable messages that run after a disconnect
   */
  queue: QueuedMessages
  /**
   * Whether this client has been closed
   */
  closed: boolean
  /**
   * Whether this client is currently connected
   */
  connected: boolean
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
type CreateParams = {
  target: string
  onAsynchronousError: Function
  host?: string
  port?: number
  onReconnect?: (client: CriClient) => void
  protocolManager?: ProtocolManagerShape
  fullyManageTabs?: boolean
  browserClient?: CriClient
}

export const create = async ({
  target,
  onAsynchronousError,
  host,
  port,
  onReconnect,
  protocolManager,
  fullyManageTabs,
  browserClient,
}: CreateParams): Promise<CriClient> => {
  const subscriptions: Subscription[] = []
  const enableCommands: EnableCommand[] = []
  let enqueuedCommands: EnqueuedCommand[] = []

  let closed = false // has the user called .close on this?
  let connected = false // is this currently connected to CDP?
  let crashed = false // has this crashed?

  let cri: CDPClient
  let client: CriClient

  const reconnect = async (retryIndex) => {
    connected = false

    if (closed) {
      debug('disconnected, not reconnecting because client is closed %o', { closed, target })
      enqueuedCommands = []

      return
    }

    client.onReconnectAttempt?.(retryIndex)

    debug('disconnected, attempting to reconnect... %o', { retryIndex, closed, target })

    await connect()

    debug('restoring subscriptions + running *.enable and queued commands... %o', { subscriptions, enableCommands, enqueuedCommands, target })

    subscriptions.forEach((sub) => {
      cri.on(sub.eventName, sub.cb as any)
    })

    // '*.enable' commands need to be resent on reconnect or any events in
    // that namespace will no longer be received
    await Promise.all(enableCommands.map(({ command, params, sessionId }) => {
      return cri.send(command, params, sessionId)
    }))

    enqueuedCommands.forEach((cmd) => {
      cri.send(cmd.command, cmd.params, cmd.sessionId).then(cmd.p.resolve as any, cmd.p.reject as any)
    })

    enqueuedCommands = []

    if (onReconnect) {
      onReconnect(client)
    }
  }

  const retryReconnect = async () => {
    debug('disconnected, starting retries to reconnect... %o', { closed, target })

    const retry = async (retryIndex = 0) => {
      retryIndex++

      try {
        return await reconnect(retryIndex)
      } catch (err) {
        if (closed) {
          debug('could not reconnect because client is closed %o', { closed, target })

          enqueuedCommands = []

          return
        }

        debug('could not reconnect, retrying... %o', { closed, target, err })

        if (retryIndex < 20) {
          await new Promise((resolve) => setTimeout(resolve, 100))

          return retry(retryIndex)
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

    debug('connecting %o', { connected, target })

    cri = await CRI({
      host,
      port,
      target,
      local: true,
      useHostName: true,
    }) as CDPClient

    connected = true

    debug('connected %o', { connected, target })

    maybeDebugCdpMessages(cri)

    // Having a host set indicates that this is the child cri target, a.k.a.
    // the main Cypress tab (as opposed to the root browser cri target)
    const isChildTarget = !!host

    // don't reconnect in these circumstances
    if (
      // is a child target. we only need to reconnect the root browser target
      !isChildTarget
      // running cypress in cypress - there are a lot of disconnects that happen
      // that we don't want to reconnect on
      && !process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
    ) {
      cri.on('disconnect', retryReconnect)
    }

    // We're only interested in child target traffic. Browser cri traffic is
    // handled in browser-cri-client.ts. The basic approach here is we attach
    // to targets and enable network traffic. We must attach in a paused state
    // so that we can enable network traffic before the target starts running.
    if (isChildTarget) {
      cri.on('Target.targetCrashed', async (event) => {
        if (event.targetId !== target) {
          return
        }

        debug('crash detected')
        crashed = true
      })

      if (fullyManageTabs) {
        cri.on('Target.attachedToTarget', async (event) => {
          try {
            // Service workers get attached at the page and browser level. We only want to handle them at the browser level
            // We don't track child tabs/page network traffic. 'other' targets can't have network enabled
            if (event.targetInfo.type !== 'service_worker' && event.targetInfo.type !== 'page' && event.targetInfo.type !== 'other') {
              await cri.send('Network.enable', protocolManager?.networkEnableOptions ?? DEFAULT_NETWORK_ENABLE_OPTIONS, event.sessionId)
            }

            if (event.waitingForDebugger) {
              await cri.send('Runtime.runIfWaitingForDebugger', undefined, event.sessionId)
            }
          } catch (error) {
            // it's possible that the target was closed before we could enable network and continue, in that case, just ignore
            debug('error attaching to target cri', error)
          }
        })

        // Ideally we could use filter rather than checking the type above, but that was added relatively recently
        await cri.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true })
        await cri.send('Target.setDiscoverTargets', { discover: true })
      }
    }
  }

  await connect()

  client = {
    targetId: target,

    async send (command: CdpCommand, params?: object, sessionId?: string) {
      if (crashed) {
        return Promise.reject(new Error(`${command} will not run as the target browser or tab CRI connection has crashed`))
      }

      const enqueue = () => {
        debug('enqueueing command', { command, params })

        return new Promise((resolve, reject) => {
          const obj: EnqueuedCommand = {
            command,
            p: { resolve, reject } as DeferredPromise,
          }

          if (params) {
            obj.params = params
          }

          if (sessionId) {
            obj.sessionId = sessionId
          }

          enqueuedCommands.push(obj)
        })
      }

      // Keep track of '*.enable' commands so they can be resent when
      // reconnecting
      if (command.endsWith('.enable') || ['Runtime.addBinding', 'Target.setDiscoverTargets'].includes(command)) {
        const obj: EnableCommand = {
          command,
        }

        if (params) {
          obj.params = params
        }

        if (sessionId) {
          obj.sessionId = sessionId
        }

        enableCommands.push(obj)
      }

      if (connected) {
        try {
          return await cri.send(command, params, sessionId)
        } catch (err) {
          // This error occurs when the browser has been left open for a long
          // time and/or the user's computer has been put to sleep. The
          // socket disconnects and we need to recreate the socket and
          // connection
          if (!WEBSOCKET_NOT_OPEN_RE.test(err.message)) {
            throw err
          }

          debug('encountered closed websocket on send %o', { command, params, sessionId, err })

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

      cri.on(eventName, cb)
      // This ensures that we are notified about the browser's network events that have been registered (e.g. service workers)
      // Long term we should use flat mode entirely across all of chrome remote interface
      if (eventName.startsWith('Network.')) {
        browserClient?.on(eventName, cb)
      }
    },

    off (eventName, cb) {
      subscriptions.splice(subscriptions.findIndex((sub) => {
        return sub.eventName === eventName && sub.cb === cb
      }), 1)

      cri.off(eventName, cb)
      // This ensures that we are notified about the browser's network events that have been registered (e.g. service workers)
      // Long term we should use flat mode entirely across all of chrome remote interface
      if (eventName.startsWith('Network.')) {
        browserClient?.off(eventName, cb)
      }
    },

    get ws () {
      return cri._ws
    },

    get queue () {
      return {
        enableCommands,
        enqueuedCommands,
        subscriptions,
      }
    },

    get closed () {
      return closed
    },

    get connected () {
      return connected
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
