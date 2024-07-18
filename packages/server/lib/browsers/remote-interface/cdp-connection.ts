import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'

import EventEmitter from 'events'
import CDP from 'chrome-remote-interface'

import type { CdpEvent, OffFn } from '../cdp_automation'

interface ICDPConnection {
  //connect (): Promise<void>
  disconnect (): Promise<void>
  //getConnection(): Promise<CDP.Client>
  //send: SendDebuggerCommand
  on: CDP.Client['on']
  off: OffFn
}

type CDPListener<T extends keyof ProtocolMapping.Events> = (params: ProtocolMapping.Events[T][0], sessionId?: string) => void

/**
 * current thinking:
 * use private event emitter to keep track of listeners added to this connection, and use
 * CDP Client's 'event' event to dispatch events out - no need to reattach a collection of
 * listeners each time it reconnects, only re-enable enablements and re-send queued commands
 */

// CDPClient extends EventEmitter, but does not export that type information from its
// definitelytyped module
type CdpClient = Exclude<EventEmitter, CDP.Client> & CDP.Client

export class CDPConnection implements ICDPConnection {
  private _emitter: EventEmitter = new EventEmitter()
  private _connection: CdpClient | undefined
  private _autoReconnect: boolean
  private _terminated: boolean = false
  private _enableNetwork: boolean = false
  private _resumeDebugger: boolean = false
  private _detectTargetCrash: boolean = false
  private _autoAttachAndDiscover: boolean = false

  constructor (private readonly _options: CDP.Options & {
    autoReconnect?: boolean
    detectTargetCrash?: boolean
    enableNetwork?: boolean
    resumeDebugger?: boolean
    autoAttachAndDiscover?: boolean
  }) {
    this._autoReconnect = _options.autoReconnect ?? false
    this._enableNetwork = _options.enableNetwork ?? false
    this._resumeDebugger = _options.resumeDebugger ?? false
    this._detectTargetCrash = _options.resumeDebugger ?? false
    this._autoAttachAndDiscover = _options.autoAttachAndDiscover ?? false
  }

  on<T extends CdpEvent> (event: T, callback: CDPListener<T>) {
    this._emitter.on(event, callback)

    return this
  }
  off<T extends CdpEvent> (event: T, callback: CDPListener<T>) {
    this._emitter.off(event, callback)
  }
  /*
  send<T extends CdpCommand> (
    command: T,
    data?: ProtocolMapping.Commands[T]['paramsType'][0],
    sessionId?: string,
  ) {

  }
*/
  async disconnect () {
    if (this._terminated && !this._connection) {
      return
    }

    this._terminated = true

    await this._gracefullyDisconnect()
  }

  private async _connect (): Promise<CdpClient> {
    if (this._terminated) {
      throw new Error('Cannot connect, CDP connection has been disconnected and dismantled')
    }

    if (this._connection) {
      await this._gracefullyDisconnect()
    }

    this._connection = await CDP(this._options) as CdpClient

    if (this._autoReconnect) {
      this._connection.on('disconnect', this._reconnect)
    }

    if (this._detectTargetCrash) {
      this._connection.on('Target.target')
    }

    return this._connection
  }

  private _reconnect = () => {}

  private async _gracefullyDisconnect () {
    await this._connection?.close()
    for (const eventName of this._connection?.eventNames() || []) {
      this._connection?.removeAllListeners(eventName)
    }
    this._connection = undefined
  }
}
