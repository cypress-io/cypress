import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import Debug from 'debug'
import EventEmitter from 'events'
import CDP from 'chrome-remote-interface'
import type { CypressError } from '@packages/errors'
import { debugCdpConnection, DebuggableCDPClient } from './debug-cdp-connection'
import type { CdpEvent, CdpCommand } from './cdp_automation'
import { CDPDisconnectedError, CDPTerminatedError, CDPAlreadyConnectedError } from './cri-errors'
import { asyncRetry } from '../util/async_retry'
import * as errors from '../errors'
import type WebSocket from 'ws'

const verboseDebugNs = 'cypress-verbose:server:browsers:cdp-connection'

export type CDPListener<T extends keyof ProtocolMapping.Events> = (params: ProtocolMapping.Events[T][0], sessionId?: string) => void

// CDPClient extends EventEmitter, but does not export that type information from its
// definitelytyped module
export type CdpClient = Exclude<EventEmitter, CDP.Client> & CDP.Client

/**
 * There are three error messages we can encounter which should not be re-thrown, but
 * should trigger a reconnection attempt if one is not in progress, and enqueue the
 * command that errored. This regex is used in client.send to check for:
 * - WebSocket connection closed
 * - WebSocket not open
 * - WebSocket already in CLOSING or CLOSED state
 */
const isWebsocketClosedErrorMessage = (message: string) => {
  return /^WebSocket (?:connection closed|is (?:not open|already in CLOSING or CLOSED state))/.test(message)
}

export type CDPConnectionOptions = {
  automaticallyReconnect: boolean
}

type CDPConnectionEventListeners = {
  'cdp-connection-reconnect-error': (err: CypressError) => void
  'cdp-connection-reconnect': () => void
  'cdp-connection-closed': () => void
  'cdp-connection-reconnect-attempt': (attemptNumber: number) => void
}
export type CDPConnectionEvent = keyof CDPConnectionEventListeners

type CDPConnectionEventListener<T extends CDPConnectionEvent> = CDPConnectionEventListeners[T]

export class CDPConnection {
  private _emitter: EventEmitter = new EventEmitter()
  private _connection: CdpClient | undefined
  private _autoReconnect: boolean
  private _terminated: boolean = false
  private _reconnection: Promise<void> | undefined
  private debug: Debug.Debugger
  private verboseDebug: Debug.Debugger

  constructor (private readonly _options: CDP.Options, connectionOptions: CDPConnectionOptions) {
    this._autoReconnect = connectionOptions.automaticallyReconnect
    this.debug = Debug(`cypress:server:browsers:cdp-connection:${_options.target}`)
    this.verboseDebug = Debug(`${verboseDebugNs}:${_options.target}`)
  }

  get terminated () {
    return this._terminated
  }

  get ws () {
    // this is reached into by browser-cri-client to detect close events - needs rethinking
    return (this._connection as { _ws?: WebSocket})._ws
  }

  on<T extends CdpEvent> (event: T, callback: CDPListener<T>) {
    this.debug('attaching event listener to cdp connection', event)

    this._emitter.on(event, callback)
  }
  addConnectionEventListener<T extends CDPConnectionEvent> (event: T, callback: CDPConnectionEventListener<T>) {
    this.debug('adding connection event listener for ', event)
    this._emitter.on(event, callback)
  }
  off<T extends CdpEvent> (event: T, callback: CDPListener<T>) {
    this._emitter.off(event, callback)
  }
  removeConnectionEventListener<T extends CDPConnectionEvent> (event: T, callback: CDPConnectionEventListener<T>) {
    this._emitter.off(event, callback)
  }

  async connect (): Promise<void> {
    if (this._terminated) {
      throw new CDPTerminatedError(`Cannot connect to CDP. Client target ${this._options.target} has been terminated.`)
    }

    if (this._connection) {
      throw new CDPAlreadyConnectedError(`Cannot connect to CDP. Client target ${this._options.target} is already connected. Did you disconnect first?`)
    }

    this._connection = await CDP(this._options) as CdpClient

    debugCdpConnection(this.verboseDebug.namespace, this._connection as DebuggableCDPClient)

    this._connection.on('event', this._broadcastEvent)

    if (this._autoReconnect) {
      this._connection.on('disconnect', this._reconnect)
    }
  }

  async disconnect () {
    this.debug('disconnect of target %s requested.', this._options.target, { terminated: this._terminated, connection: !!this._connection, reconnection: !!this._reconnection })
    if (this._terminated && !this._connection) {
      return
    }

    this._terminated = true

    if (this._connection) {
      await this._gracefullyDisconnect()
      this._emitter.emit('cdp-connection-closed')
    }
  }

  private _gracefullyDisconnect = async () => {
    this._connection?.off('event', this._broadcastEvent)
    this._connection?.off('disconnect', this._reconnect)

    await this._connection?.close()
    this._connection = undefined
  }

  async send<T extends CdpCommand> (
    command: T,
    data?: ProtocolMapping.Commands[T]['paramsType'][0],
    sessionId?: string,
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (this.terminated) {
      throw new CDPDisconnectedError(`${command} will not run as the CRI connection to Target ${this._options.target} has been terminated.`)
    }

    if (!this._connection) {
      throw new CDPDisconnectedError(`${command} will not run as the CRI connection to Target ${this._options.target} has not been established.`)
    }

    try {
      return await this._connection.send(command, data, sessionId)
    } catch (e) {
      // Clients may wish to determine if the command should be enqueued
      // should enqueue logic live in this class tho??
      if (isWebsocketClosedErrorMessage(e.message)) {
        throw new CDPDisconnectedError(`${command} failed due to the websocket being disconnected.`, e)
      }

      throw e
    }
  }

  private _reconnect = async () => {
    this.debug('Reconnection requested')
    if (this._terminated) {
      return
    }

    if (this._reconnection) {
      return this._reconnection
    }

    if (this._connection) {
      try {
        await this._gracefullyDisconnect()
      } catch (e) {
        this.debug('Error cleaning up existing CDP connection before creating a new connection: ', e)
      } finally {
        this._connection = undefined
      }
    }

    let attempt = 0

    this._reconnection = asyncRetry(async () => {
      attempt++

      this.debug('Reconnection attempt %d for Target %s', attempt, this._options.target)

      if (this._terminated) {
        this.debug('Not reconnecting, connection to %s has been terminated', this._options.target)
        throw new CDPTerminatedError(`Cannot reconnect to CDP. Client target ${this._options.target} has been terminated.`)
      }

      this._emitter.emit('cdp-connection-reconnect-attempt', attempt)

      await this.connect()
    }, {
      maxAttempts: 20,
      retryDelay: () => {
        return 100
      },
      shouldRetry (err) {
        return !(err && CDPTerminatedError.isCDPTerminatedError(err))
      },
    })()

    try {
      await this._reconnection
      this._emitter.emit('cdp-connection-reconnect')
    } catch (err) {
      this.debug('error(s) on reconnecting: ', err)
      const significantError: Error = err.errors ? (err as AggregateError).errors[err.errors.length - 1] : err

      const retryHaltedDueToClosed = CDPTerminatedError.isCDPTerminatedError(err) ||
        (err as AggregateError)?.errors?.find((predicate) => CDPTerminatedError.isCDPTerminatedError(predicate))

      // if .disconnect() was called while trying to reconnect, there will be no active connection
      // so the .disconnect() method will not emit the connection closed event. However, we do
      // want to emit that once the reconnection attempts cease due to being closed.
      if (retryHaltedDueToClosed) {
        this._emitter.emit('cdp-connection-closed')
      } else {
        const cdpError = errors.get('CDP_COULD_NOT_RECONNECT', significantError)

        cdpError.isFatalApiErr = true
        this._emitter.emit('cdp-connection-reconnect-error', cdpError)
      }
    }

    this._reconnection = undefined
  }

  private _broadcastEvent = ({ method, params, sessionId }: { method: CdpEvent, params: Record<string, any>, sessionId?: string }) => {
    this.verboseDebug('rebroadcasting event', method, params, sessionId)

    this._emitter.emit('event', { method, params, sessionId })
    this._emitter.emit(method, params, sessionId)
    this._emitter.emit(`${method}.${sessionId}`, params)
  }
}
