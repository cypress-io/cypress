import debugModule from 'debug'
import { CDPCommandQueue } from './cdp-command-queue'
import { CDPConnection, CDPListener } from './cdp-connection'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type WebSocket from 'ws'
import type { CypressError } from '@packages/errors'
import type { SendDebuggerCommand, OnFn, OffFn, CdpCommand, CdpEvent } from './cdp_automation'
import { CDPDisconnectedError } from './cri-errors'
import type { ProtocolManagerShape } from '@packages/types'

const debug = debugModule('cypress:server:browsers:cri-client')

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
  ws?: WebSocket
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

type DeferredPromise = { resolve: Function, reject: Function }
type CreateParams = {
  target: string
  onAsynchronousError: (err: CypressError) => void
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
  // subscriptions are recorded, but this may no longer be necessary. cdp event listeners
  // need only be added to the connection instance, not the (ephemeral) underlying
  // CDP.Client instances
  private subscriptions: Subscription[] = []
  private enableCommands: EnableCommand[] = []
  private enqueuedCommands: EnqueuedCommand[] = []

  private _commandQueue: CDPCommandQueue = new CDPCommandQueue()

  private _closed = false
  private _connected = false
  private _isChildTarget = false

  private _crashed = false
  private cdpConnection: CDPConnection

  private constructor (
    public targetId: string,
    onAsynchronousError: (err: CypressError) => void,
    private host?: string,
    private port?: number,
    private onReconnect?: (client: CriClient) => void,
    private protocolManager?: ProtocolManagerShape,
    private fullyManageTabs?: boolean,
    private browserClient?: ICriClient,
    onReconnectAttempt?: (retryIndex: number) => void,
    onCriConnectionClosed?: () => void,
  ) {
    debug('creating cri client with', {
      host, port, targetId,
    })

    // refactor opportunity:
    // due to listeners passed in along with connection options, the fns that instantiate this
    // class should instantiate and listen to the connection directly rather than having this
    // constructor create them. The execution and/or definition of these callbacks is not this
    // class' business.
    this.cdpConnection = new CDPConnection({
      host: this.host,
      port: this.port,
      target: this.targetId,
      local: true,
      useHostName: true,
    }, {
      // Only automatically reconnect if: this is the root browser cri target (no host), or cy in cy
      automaticallyReconnect: !this.host && !process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF,
    })

    this.cdpConnection.addConnectionEventListener('cdp-connection-reconnect-error', onAsynchronousError)
    this.cdpConnection.addConnectionEventListener('cdp-connection-reconnect', this._onCdpConnectionReconnect)

    if (onCriConnectionClosed) {
      this.cdpConnection.addConnectionEventListener('cdp-connection-closed', onCriConnectionClosed)
    }

    if (onReconnectAttempt) {
      this.cdpConnection.addConnectionEventListener('cdp-connection-reconnect-attempt', onReconnectAttempt)
    }

    this._isChildTarget = !!this.host

    if (this._isChildTarget) {
      // If crash listeners are added at the browser level, tabs/page connections do not emit them.
      this.cdpConnection.on('Target.targetCrashed', async (event) => {
        debug('crash event detected', event)
        if (event.targetId !== this.targetId) {
          return
        }

        debug('crash detected')
        this._crashed = true
      })

      if (fullyManageTabs) {
        this.cdpConnection.on('Target.attachedToTarget', this._onAttachedToTarget)
      }
    }
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
    onCriConnectionClosed,
  }: CreateParams): Promise<CriClient> {
    const newClient = new CriClient(target, onAsynchronousError, host, port, onReconnect, protocolManager, fullyManageTabs, browserClient, onReconnectAttempt, onCriConnectionClosed)

    await newClient.connect()

    return newClient
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

  // this property is accessed by browser-cri-client, to event on websocket closed.
  get ws () {
    return this.cdpConnection.ws
  }

  get closed () {
    return this._closed
  }

  get connected () {
    return this._connected
  }

  get crashed () {
    return this._crashed
  }

  public connect = async () => {
    debug('connecting %o', { connected: this._connected, target: this.targetId })

    await this.cdpConnection.connect()

    this._connected = true

    if (this._isChildTarget) {
    // Ideally we could use filter rather than checking the type above, but that was added relatively recently
      await this.cdpConnection.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true })
      await this.cdpConnection.send('Target.setDiscoverTargets', { discover: true })
    }

    debug('connected %o', { connected: this._connected, target: this.targetId })
  }

  public send = async <TCmd extends CdpCommand> (
    command: TCmd,
    params?: CmdParams<TCmd>,
    sessionId?: string,
  ): Promise<ProtocolMapping.Commands[TCmd]['returnType']> => {
    if (this._crashed) {
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

    if (this._connected && this.cdpConnection) {
      try {
        return await this.cdpConnection.send(command, params, sessionId)
      } catch (err) {
        debug('Encountered error on send %o', { command, params, sessionId, err })
        // This error occurs when the browser has been left open for a long
        // time and/or the user's computer has been put to sleep. The
        // socket disconnects and we need to recreate the socket and
        // connection
        if (!CDPDisconnectedError.isCDPDisconnectedError(err)) {
          throw err
        }

        debug('error classified as WEBSOCKET_NOT_OPEN_RE; enqueuing and attempting to reconnect')

        const p = this._enqueueCommand(command, params, sessionId)

        // if enqueued commands were wiped out from the reconnect and the socket is already closed, reject the command as it will never be run
        if (this.enqueuedCommands.length === 0 && this.cdpConnection.terminated) {
          debug('connection was closed was trying to reconnect')

          return Promise.reject(new Error(`${command} will not run as browser CRI connection was reset`))
        }

        return p
      }
    }

    return this._enqueueCommand(command, params, sessionId)
  }

  public on = <T extends CdpEvent> (eventName: T, cb: CDPListener<T>) => {
    if (eventName === 'Target.targetCrashed') {
      debug('attaching crash listener')
    }

    this.cdpConnection?.on<T>(eventName, cb)

    this.subscriptions.push({ eventName, cb })
    debug('registering CDP on event %o', { eventName })

    if (eventName.startsWith('Network.')) {
      this.browserClient?.on(eventName, cb)
    }
  }

  public off = <T extends keyof ProtocolMapping.Events> (eventName: T, cb: (data: ProtocolMapping.Events[T][0], sessionId?: string) => void) => {
    this.subscriptions.splice(this.subscriptions.findIndex((sub) => {
      return sub.eventName === eventName && sub.cb === cb
    }), 1)

    this.cdpConnection!.off(eventName, cb)
    // This ensures that we are notified about the browser's network events that have been registered (e.g. service workers)
    // Long term we should use flat mode entirely across all of chrome remote interface
    if (eventName.startsWith('Network.')) {
      this.browserClient?.off(eventName, cb)
    }
  }

  public close = async () => {
    debug('closing')
    if (this._closed || this.cdpConnection?.terminated) {
      debug('not closing, cri client is already closed %o', { closed: this._closed, target: this.targetId, connection: this.cdpConnection })

      return
    }

    debug('closing cri client %o', { closed: this._closed, target: this.targetId })

    this._closed = true

    try {
      await this.cdpConnection?.disconnect()
      debug('closed cri client %o', { closed: this._closed, target: this.targetId })
    } catch (e) {
      debug('error closing cri client targeting %s: %o', this.targetId, e)
    }
  }

  private _onAttachedToTarget = async (event: ProtocolMapping.Events['Target.attachedToTarget'][0]) => {
    // We're only interested in child target traffic. Browser cri traffic is
    // handled in browser-cri-client.ts. The basic approach here is we attach
    // to targets and enable network traffic. We must attach in a paused state
    // so that we can enable network traffic before the target starts running.
    if (!this.fullyManageTabs || !this.host) {
      return
    }

    try {
      // Service workers get attached at the page and browser level. We only want to handle them at the browser level
      // We don't track child tabs/page network traffic. 'other' targets can't have network enabled
      if (event.targetInfo.type !== 'service_worker' && event.targetInfo.type !== 'page' && event.targetInfo.type !== 'other') {
        await this.cdpConnection.send('Network.enable', this.protocolManager?.networkEnableOptions ?? DEFAULT_NETWORK_ENABLE_OPTIONS, event.sessionId)
      }
    } catch (error) {
      // it's possible that the target was closed before we could enable network, in that case, just ignore
      debug('error attaching to target cri: %o', { error, event })
    }

    if (event.waitingForDebugger) {
      try {
        await this.cdpConnection.send('Runtime.runIfWaitingForDebugger', undefined, event.sessionId)
      } catch (error) {
        // it's possible that the target was closed before we could tell it to run, in that case, just ignore
        debug('error running Runtime.runIfWaitingForDebugger: %o', { error, event })
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

  private _onCdpConnectionReconnect = async () => {
    debug('cdp connection reconnected')
    try {
      await this._restoreState()
      await this._drainCommandQueue()

      await this.protocolManager?.cdpReconnect()

      try {
        if (this.onReconnect) {
          await this.onReconnect(this)
        }
      } catch (e) {
        debug('uncaught error in CriClient reconnect callback: ', e)
      }
    } catch (e) {
      debug('error re-establishing state on reconnection: ', e)
    }
  }

  private async _restoreState () {
    // '*.enable' commands need to be resent on reconnect or any events in
    // that namespace will no longer be received
    debug('re-enabling %d enablements', this.enableCommands.length)
    await Promise.all(this.enableCommands.map(async ({ command, params, sessionId }) => {
      // these commands may have been enqueued, so we need to resolve those promises and remove
      // them from the queue when we send here
      const inFlightCommand = this._commandQueue.extract({ command, params, sessionId })

      try {
        const response = await this.cdpConnection.send(command, params, sessionId)

        inFlightCommand?.deferred.resolve(response)
      } catch (err) {
        debug('error re-enabling %s: ', command, err)
        if (CDPDisconnectedError.isCDPDisconnectedError(err)) {
          // this error is caught in _onCdpConnectionReconnect
          // because this is a connection error, the enablement will be re-attempted
          // when _onCdpConnectionReconnect is called again. We do need to ensure the
          // original in-flight command, if present, is re-enqueued.
          if (inFlightCommand) {
            this._commandQueue.unshift(inFlightCommand)
          }

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
        const response = await this.cdpConnection.send(enqueued.command, enqueued.params, enqueued.sessionId)

        debug('sent command, received ', { response })
        enqueued.deferred.resolve(response)
        debug('resolved enqueued promise')
      } catch (e) {
        debug('enqueued command %s failed:', enqueued.command, e)
        if (CDPDisconnectedError.isCDPDisconnectedError(e)) {
          debug('command failed due to disconnection; enqueuing for resending once reconnected')
          this._commandQueue.unshift(enqueued)
          throw e
        } else {
          enqueued.deferred.reject(e)
        }
      }
    }
  }
}
