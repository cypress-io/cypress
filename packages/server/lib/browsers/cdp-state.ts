import CDP from 'chrome-remote-interface'
import type EventEmitter from 'events'

import type { SendDebuggerCommand, OnFn, OffFn, CdpCommand, CdpEvent } from './cdp_automation'

import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'

interface CDPClient extends CDP.Client {
  off: EventEmitter['off']
  _ws: WebSocket
}

/* keeps track of enablements and subscriptions that must be re-applied when cri-client reconnects */

type Subscription = {
  eventName: CdpEvent
  callback: (...args: any[]) => void
}

type Enablement = {
  command: CdpCommand
  params: any
  sessionId?: string
}

export class CdpState {
  private _subscriptions: Subscription[] = []
  private _enablements: Map<CdpCommand, Enablement> = new Map()
  private _cdpClient: CDPClient | undefined

  public connect (cdpClient: CDPClient) {
    if (this._cdpClient) {
      this._subscriptions.forEach(({ eventName, callback }) => {
        this._cdpClient?.off(eventName, callback)
      })
    }

    this._cdpClient = cdpClient
  }

  public restoreState () {
    this._subscriptions.forEach(({ eventName, callback }) => {
      this.subscribe(eventName, callback)
    })
  }

  public subscribe (eventName: CdpEvent, callback: (...args: any[]) => void) {
    this._cdpClient?.on(eventName, callback)
    this._subscriptions.push({ eventName, callback })
  }

  public unsubscribe (eventName: CdpEvent, callback: (...args: any[]) => void) {
    this._cdpClient?.off(eventName, callback)
    const idx = this._subscriptions.findIndex((sub) => {
      return sub.eventName === eventName && sub.callback === callback
    })

    this._subscriptions.splice(idx, 1)
  }

  public enable<T extends CdpCommand> (command: T, params?: ProtocolMapping.Commands[T]['paramsType'][0], sessionId?: string) {
    if (isEnablementCommand(command)) {
      this._cdpClient?.send(command, params, sessionId)
      this._enablements.set(command, { command, params, sessionId })
    }
  }
}

export function isEnablementCommand (command: CdpCommand) {
  return command.endsWith('.enable') || ['Runtime.addBinding', 'Target.setDiscoverTargets'].includes(command)
}
