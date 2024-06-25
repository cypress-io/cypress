import CDP from 'chrome-remote-interface'
import debugModule from 'debug'
import _ from 'lodash'
import * as errors from '../errors'
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
}

export class CriClient implements ICriClient {
  private subscriptions: Subscription[] = []
  private enableCommands: EnableCommand[] = []
  private enqueuedCommands: EnqueuedCommand[] = []

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
  ) {}

  get ws () {
    return this.cri!._ws
  }

  get queue () {
    return {
      enableCommands: this.enableCommands,
      enqueuedCommands: this.enqueuedCommands,
      subscriptions: this.subscriptions,
    }
  }

  get closed () {
    return this._closed
  }

  get connected () {
    return this._connected
  }

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
  }: CreateParams): Promise<CriClient> {
    const newClient = new CriClient(target, onAsynchronousError, host, port, onReconnect, protocolManager, fullyManageTabs, browserClient, onReconnectAttempt)

    await newClient.connect()

    return newClient
  }

  private async reconnect (retryIndex: number = 0) {
    this._connected = false

    if (this.closed) {
      debug('disconnected, not reconnecting because client is closed %o', { closed: this.closed, target: this.targetId })
      this.enqueuedCommands = []

      return
    }

    this.onReconnectAttempt?.(retryIndex)

    debug('disconnected, attempting to reconnect... %o', { retryIndex, closed: this.closed, target: this.targetId })

    await this.connect()

    debug('restoring subscriptions + running *.enable and queued commands... %o', { subscriptions: this.subscriptions, enableCommands: this.enableCommands, enqueuedCommands: this.enqueuedCommands, target: this.targetId })

    this.subscriptions.forEach((sub) => {
      this.cri?.on(sub.eventName, sub.cb as any)
    })

    // '*.enable' commands need to be resent on reconnect or any events in
    // that namespace will no longer be received
    await Promise.all(this.enableCommands.map(async ({ command, params, sessionId }) => {
      // these commands may have been enqueued, so we need to resolve those promises and remove
      // them from the queue when we send here
      const isInFlightCommand = (candidate: EnqueuedCommand) => {
        return candidate.command === command && candidate.params === params && candidate.sessionId === sessionId
      }
      const enqueued = this.enqueuedCommands.find(isInFlightCommand)

      try {
        const response = await this.cri?.send(command, params, sessionId)

        enqueued?.p.resolve(response)
      } catch (e) {
        enqueued?.p.reject(e)
      } finally {
        this.enqueuedCommands = this.enqueuedCommands.filter((candidate) => {
          return !isInFlightCommand(candidate)
        })
      }
    }))

    this.enqueuedCommands.forEach((cmd) => {
      this.cri!.send(cmd.command, cmd.params, cmd.sessionId).then(cmd.p.resolve as any, cmd.p.reject as any)
    })

    this.enqueuedCommands = []

    if (this.onReconnect) {
      this.onReconnect(this)
    }

    // When CDP disconnects, it will automatically reconnect and re-apply various subscriptions
    // (e.g. DOM.enable, Network.enable, etc.). However, we need to restart tracking DOM mutations
    // from scratch. We do this by capturing a brand new full snapshot of the DOM.
    await this.protocolManager?.cdpReconnect()
  }

  private retryReconnect = async () => {
    if (this.reconnection) {
      debug('reconnection in progress; not starting new process, returning promise for in-flight reconnection attempt')

      return this.reconnection
    }

    debug('disconnected, starting retries to reconnect... %o', { closed: this.closed, target: this.targetId })

    const retry = async (retryIndex = 0) => {
      retryIndex++

      try {
        const attempt = await this.reconnect(retryIndex)

        this.reconnection = undefined

        return attempt
      } catch (err) {
        if (this.closed) {
          debug('could not reconnect because client is closed %o', { closed: this.closed, target: this.targetId })

          this.enqueuedCommands = []

          return
        }

        debug('could not reconnect, retrying... %o', { closed: this.closed, target: this.targetId, err })

        if (retryIndex < 20) {
          await new Promise((resolve) => setTimeout(resolve, 100))

          return retry(retryIndex)
        }

        const cdpError = errors.get('CDP_COULD_NOT_RECONNECT', err)

        // If we cannot reconnect to CDP, we will be unable to move to the next set of specs since we use CDP to clean up and close tabs. Marking this as fatal
        cdpError.isFatalApiErr = true
        this.reconnection = undefined
        this.onAsynchronousError(cdpError)
      }
    }

    this.reconnection = retry()

    return this.reconnection
  }

  private enqueueCommand <TCmd extends CdpCommand> (
    command: TCmd,
    params: ProtocolMapping.Commands[TCmd]['paramsType'][0],
    sessionId?: string,
  ): Promise<ProtocolMapping.Commands[TCmd]['returnType']> {
    return new Promise((resolve, reject) => {
      const obj: EnqueuedCommand = {
        command,
        p: { resolve, reject },
      }

      if (params) {
        obj.params = params
      }

      if (sessionId) {
        obj.sessionId = sessionId
      }

      this.enqueuedCommands.push(obj)
    })
  }

  public connect = async () => {
    await this.cri?.close()

    debug('connecting %o', { connected: this._connected, target: this.targetId })

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
      this.cri.on('disconnect', this.retryReconnect)
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

        const p = this.enqueueCommand(command, params, sessionId)

        await this.retryReconnect()

        // if enqueued commands were wiped out from the reconnect and the socket is already closed, reject the command as it will never be run
        if (this.enqueuedCommands.length === 0 && this.closed) {
          debug('connection was closed was trying to reconnect')

          return Promise.reject(new Error(`${command} will not run as browser CRI connection was reset`))
        }

        return p
      }
    }

    return this.enqueueCommand(command, params, sessionId)
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
    }
  }
}
