import CDP from 'chrome-remote-interface'
import debugModule from 'debug'
import _ from 'lodash'
import * as errors from '../errors'
import { CDPCommandQueue } from './cdp-command-queue'
import { asyncRetry } from '../util/async_retry'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type EventEmitter from 'events'
import type WebSocket from 'ws'

import type { SendDebuggerCommand, OnFn, OffFn, CdpCommand, CdpEvent } from './cdp_automation'
import type { ProtocolManagerShape } from '@packages/types'

const debug = debugModule('cypress:server:browsers:cri-client')
const debugVerbose = debugModule('cypress-verbose:server:browsers:cri-client')
// debug using cypress-verbose:server:browsers:cri-client:send:*
const debugVerboseSend = debugModule(`${debugVerbose.namespace}:send:[-->]`)
// debug using cypress-verbose:server:browsers:cri-client:recv:*
const debugVerboseReceive = debugModule(`${debugVerbose.namespace}:recv:[<--]`)
// debug using cypress-verbose:server:browsers:cri-client:err:*
const debugVerboseLifecycle = debugModule(`${debugVerbose.namespace}:ws`)

/**
 * There are three error messages we can encounter which should not be re-thrown, but
 * should trigger a reconnection attempt if one is not in progress, and enqueue the
 * command that errored. This regex is used in client.send to check for:
 * - WebSocket connection closed
 * - WebSocket not open
 * - WebSocket already in CLOSING or CLOSED state
 */
const WEBSOCKET_NOT_OPEN_RE = /^WebSocket (?:connection closed|is (?:not open|already in CLOSING or CLOSED state))/

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

type CmdParams<TCmd extends CdpCommand> = ProtocolMapping.Commands[TCmd]['paramsType'][0]

interface CDPClient extends CDP.Client {
  off: EventEmitter['off']
  _ws: WebSocket
}

const ConnectionClosedKind: 'CONNECTION_CLOSED' = 'CONNECTION_CLOSED'

class ConnectionClosedError extends Error {
  public readonly kind = ConnectionClosedKind
  static isConnectionClosedError (err: Error & { kind?: any }): err is ConnectionClosedError {
    return err.kind === ConnectionClosedKind
  }
}

export const DEFAULT_NETWORK_ENABLE_OPTIONS = {
  maxTotalBufferSize: 0,
  maxResourceBufferSize: 0,
  maxPostDataSize: 0,
}

export interface ICriClient {
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
  off: OffFn
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

      try {
        return send.call(cri._ws, data, callback)
      } catch (e: any) {
        debugVerboseSend('Error sending CDP command %o %O', JSON.parse(data), e)
        throw e
      }
    }
  }

  if (debugVerboseLifecycle.enabled) {
    cri._ws.addEventListener('open', (event) => {
      debugVerboseLifecycle(`[OPEN] %o`, event)
    })

    cri._ws.addEventListener('close', (event) => {
      debugVerboseLifecycle(`[CLOSE] %o`, event)
    })

    cri._ws.addEventListener('error', (event) => {
      debugVerboseLifecycle(`[ERROR] %o`, event)
    })
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
  browserClient?: ICriClient
  onReconnectAttempt?: (retryIndex: number) => void
  onCriConnectionClosed?: () => void
}

export class CriClient implements ICriClient {
  private subscriptions: Subscription[] = []
  private enableCommands: EnableCommand[] = []
  private enqueuedCommands: EnqueuedCommand[] = []

  private _commandQueue: CDPCommandQueue = new CDPCommandQueue()

  private _closed = false
  private _connected = false
  private crashed = false
  private reconnection: Promise<void> | undefined = undefined

  private cri: CDPClient | undefined

  private constructor (
    public targetId: string,
    private onAsynchronousError: Function,
    private host?: string,
    private port?: number,
    private onReconnect?: (client: CriClient) => void,
    private protocolManager?: ProtocolManagerShape,
    private fullyManageTabs?: boolean,
    private browserClient?: ICriClient,
    private onReconnectAttempt?: (retryIndex: number) => void,
    private onCriConnectionClosed?: () => void,
  ) {}

  static async create ({
    target,
    onAsynchronousError,
    host,
    port,
    onReconnect,
    protocolManager,
    fullyManageTabs,
    browserClient,
    onReconnectAttempt,
    onCriConnectionClosed,
  }: CreateParams): Promise<CriClient> {
    const newClient = new CriClient(target, onAsynchronousError, host, port, onReconnect, protocolManager, fullyManageTabs, browserClient, onReconnectAttempt, onCriConnectionClosed)

    await newClient.connect()

    return newClient
  }

  get ws () {
    return this.cri!._ws
  }

  // this property is accessed in a couple different places, but should be refactored to be
  // private - queues are internal to this class, and should not be exposed
  get queue () {
    return {
      enableCommands: this.enableCommands,
      enqueuedCommands: this._commandQueue.entries.map((entry) => {
        return {
          ...entry,
          p: entry.deferred,
        }
      }),
      subscriptions: this.subscriptions,
    }
  }

  get closed () {
    return this._closed
  }

  get connected () {
    return this._connected
  }

  public connect = async () => {
    await this.cri?.close()

    debug('connecting %o', { connected: this._connected, target: this.targetId })

    /**
     * TODO: https://github.com/cypress-io/cypress/issues/29744
     * this (`cri` / `this.cri`) symbol is referenced via closure in event listeners added in this method; this
     * may prevent old instances of `CDPClient` from being garbage collected.
     */

    const cri = this.cri = await CDP({
      host: this.host,
      port: this.port,
      target: this.targetId,
      local: true,
      useHostName: true,
    }) as CDPClient

    this._connected = true

    debug('connected %o', { connected: this._connected, target: this.targetId, ws: this.cri._ws })

    maybeDebugCdpMessages(this.cri)

    // Having a host set indicates that this is the child cri target, a.k.a.
    // the main Cypress tab (as opposed to the root browser cri target)
    const isChildTarget = !!this.host

    // don't reconnect in these circumstances
    if (
      // is a child target. we only need to reconnect the root browser target
      !isChildTarget
      // running cypress in cypress - there are a lot of disconnects that happen
      // that we don't want to reconnect on
      && !process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
    ) {
      this.cri.on('disconnect', this._reconnect)
    }

    // We're only interested in child target traffic. Browser cri traffic is
    // handled in browser-cri-client.ts. The basic approach here is we attach
    // to targets and enable network traffic. We must attach in a paused state
    // so that we can enable network traffic before the target starts running.
    if (isChildTarget) {
      this.cri.on('Target.targetCrashed', async (event) => {
        if (event.targetId !== this.targetId) {
          return
        }

        debug('crash detected')
        this.crashed = true
      })

      if (this.fullyManageTabs) {
        cri.on('Target.attachedToTarget', async (event) => {
          try {
            // Service workers get attached at the page and browser level. We only want to handle them at the browser level
            // We don't track child tabs/page network traffic. 'other' targets can't have network enabled
            if (event.targetInfo.type !== 'service_worker' && event.targetInfo.type !== 'page' && event.targetInfo.type !== 'other') {
              await cri.send('Network.enable', this.protocolManager?.networkEnableOptions ?? DEFAULT_NETWORK_ENABLE_OPTIONS, event.sessionId)
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
        await this.cri.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true })
        await this.cri.send('Target.setDiscoverTargets', { discover: true })
      }
    }
  }

  public send = async <TCmd extends CdpCommand> (
    command: TCmd,
    params?: CmdParams<TCmd>,
    sessionId?: string,
  ): Promise<ProtocolMapping.Commands[TCmd]['returnType']> => {
    if (this.crashed) {
      return Promise.reject(new Error(`${command} will not run as the target browser or tab CRI connection has crashed`))
    }

    // Keep track of '*.enable' commands so they can be resent when
    // reconnecting
    if (command.endsWith('.enable') || ['Runtime.addBinding', 'Target.setDiscoverTargets'].includes(command)) {
      debug('registering enable command', command)
      const obj: EnableCommand = {
        command,
      }

      if (params) {
        obj.params = params
      }

      if (sessionId) {
        obj.sessionId = sessionId
      }

      this.enableCommands.push(obj)
    }

    if (this._connected) {
      try {
        return await this.cri!.send(command, params, sessionId)
      } catch (err) {
        debug('Encountered error on send %o', { command, params, sessionId, err })
        // This error occurs when the browser has been left open for a long
        // time and/or the user's computer has been put to sleep. The
        // socket disconnects and we need to recreate the socket and
        // connection
        if (!WEBSOCKET_NOT_OPEN_RE.test(err.message)) {
          debug('error classified as not WEBSOCKET_NOT_OPEN_RE, rethrowing')
          throw err
        }

        debug('error classified as WEBSOCKET_NOT_OPEN_RE; enqueuing and attempting to reconnect')

        const p = this._enqueueCommand(command, params, sessionId)

        await this._reconnect()

        // if enqueued commands were wiped out from the reconnect and the socket is already closed, reject the command as it will never be run
        if (this.enqueuedCommands.length === 0 && this.closed) {
          debug('connection was closed was trying to reconnect')

          return Promise.reject(new Error(`${command} will not run as browser CRI connection was reset`))
        }

        return p
      }
    }

    return this._enqueueCommand(command, params, sessionId)
  }

  public on = <T extends keyof ProtocolMapping.Events> (eventName: T, cb: (data: ProtocolMapping.Events[T][0], sessionId?: string) => void) => {
    this.subscriptions.push({ eventName, cb })
    debug('registering CDP on event %o', { eventName })

    this.cri!.on(eventName, cb)

    if (eventName.startsWith('Network.')) {
      this.browserClient?.on(eventName, cb)
    }
  }

  public off = <T extends keyof ProtocolMapping.Events> (eventName: T, cb: (data: ProtocolMapping.Events[T][0], sessionId?: string) => void) => {
    this.subscriptions.splice(this.subscriptions.findIndex((sub) => {
      return sub.eventName === eventName && sub.cb === cb
    }), 1)

    this.cri!.off(eventName, cb)
    // This ensures that we are notified about the browser's network events that have been registered (e.g. service workers)
    // Long term we should use flat mode entirely across all of chrome remote interface
    if (eventName.startsWith('Network.')) {
      this.browserClient?.off(eventName, cb)
    }
  }

  public close = async () => {
    debug('closing')
    if (this._closed) {
      debug('not closing, cri client is already closed %o', { closed: this._closed, target: this.targetId })

      return
    }

    debug('closing cri client %o', { closed: this._closed, target: this.targetId })

    this._closed = true

    try {
      await this.cri?.close()
    } catch (e) {
      debug('error closing cri client targeting %s: %o', this.targetId, e)
    } finally {
      debug('closed cri client %o', { closed: this._closed, target: this.targetId })
      if (this.onCriConnectionClosed) {
        this.onCriConnectionClosed()
      }
    }
  }

  private _enqueueCommand <TCmd extends CdpCommand> (
    command: TCmd,
    params: ProtocolMapping.Commands[TCmd]['paramsType'][0],
    sessionId?: string,
  ): Promise<ProtocolMapping.Commands[TCmd]['returnType']> {
    return this._commandQueue.add(command, params, sessionId)
  }

  private _isConnectionError (error: Error) {
    return WEBSOCKET_NOT_OPEN_RE.test(error.message)
  }

  private _reconnect = async () => {
    debug('preparing to reconnect')
    if (this.reconnection) {
      debug('not reconnecting as there is an active reconnection attempt')

      return this.reconnection
    }

    this._connected = false

    if (this._closed) {
      debug('Target %s disconnected, not reconnecting because client is closed.', this.targetId)
      this._commandQueue.clear()

      return
    }

    let attempt = 1

    try {
      this.reconnection = asyncRetry(() => {
        if (this._closed) {
          throw new ConnectionClosedError('Reconnection halted due to a closed client.')
        }

        this.onReconnectAttempt?.(attempt)
        attempt++

        return this.connect()
      }, {
        maxAttempts: 20,
        retryDelay: () => 100,
        shouldRetry: (err) => {
          debug('error while reconnecting to Target %s: %o', this.targetId, err)
          if (err && ConnectionClosedError.isConnectionClosedError(err)) {
            return false
          }

          debug('Retying reconnection attempt')

          return true
        },
      })()

      await this.reconnection
      this.reconnection = undefined
      debug('reconnected')
    } catch (err) {
      debug('error(s) on reconnecting: ', err)
      const significantError: Error = err.errors ? (err as AggregateError).errors[err.errors.length - 1] : err

      const retryHaltedDueToClosed = ConnectionClosedError.isConnectionClosedError(err) ||
       (err as AggregateError)?.errors?.find((predicate) => ConnectionClosedError.isConnectionClosedError(predicate))

      if (!retryHaltedDueToClosed) {
        const cdpError = errors.get('CDP_COULD_NOT_RECONNECT', significantError)

        cdpError.isFatalApiErr = true
        this.reconnection = undefined
        this._commandQueue.clear()
        this.onAsynchronousError(cdpError)
      }

      // do not re-throw; error handling is done via onAsynchronousError
      return
    }

    try {
      await this._restoreState()
      await this._drainCommandQueue()

      await this.protocolManager?.cdpReconnect()
    } catch (e) {
      if (this._isConnectionError(e)) {
        return this._reconnect()
      }

      throw e
    }

    // previous timing of this had it happening before subscriptions/enablements were restored,
    // and before any enqueued commands were sent. This made testing problematic. Changing the
    // timing may have implications for browsers that wish to update frame tree - that process
    // will now be kicked off after state restoration & pending commands, rather then before.
    // This warrants extra scrutiny in tests. (convert to PR comment)
    if (this.onReconnect) {
      this.onReconnect(this)
    }
  }

  private async _restoreState () {
    debug('resubscribing to %d subscriptions', this.subscriptions.length)

    this.subscriptions.forEach((sub) => {
      this.cri?.on(sub.eventName, sub.cb as any)
    })

    // '*.enable' commands need to be resent on reconnect or any events in
    // that namespace will no longer be received
    debug('re-enabling %d enablements', this.enableCommands.length)
    await Promise.all(this.enableCommands.map(async ({ command, params, sessionId }) => {
      // these commands may have been enqueued, so we need to resolve those promises and remove
      // them from the queue when we send here
      const inFlightCommand = this._commandQueue.extract({ command, params, sessionId })

      try {
        const response = await this.cri?.send(command, params, sessionId)

        inFlightCommand?.deferred.resolve(response)
      } catch (err) {
        debug('error re-enabling %s: ', command, err)
        if (this._isConnectionError(err)) {
          // Connection errors are thrown here so that a reconnection attempt
          // can be made.
          throw err
        } else {
          // non-connection errors are appropriate for rejecting the original command promise
          inFlightCommand?.deferred.reject(err)
        }
      }
    }))
  }

  private async _drainCommandQueue () {
    debug('sending %d enqueued commands', this._commandQueue.entries.length)
    while (this._commandQueue.entries.length) {
      const enqueued = this._commandQueue.shift()

      if (!enqueued) {
        return
      }

      try {
        debug('sending enqueued command %s', enqueued.command)
        const response = await this.cri!.send(enqueued.command, enqueued.params, enqueued.sessionId)

        debug('sent command, received ', { response })
        enqueued.deferred.resolve(response)
        debug('resolved enqueued promise')
      } catch (e) {
        debug('enqueued command %s failed:', enqueued.command, e)
        if (this._isConnectionError(e)) {
          // similar to restoring state, connection errors are re-thrown so that
          // the connection can be restored. The command is queued for re-delivery
          // upon reconnect.
          debug('re-enqueuing command and re-throwing')
          this._commandQueue.unshift(enqueued)
          throw e
        } else {
          enqueued.deferred.reject(e)
        }
      }
    }
  }
}
