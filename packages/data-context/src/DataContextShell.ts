import { EventEmitter } from 'events'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import { DataEmitterActions } from './actions/DataEmitterActions'
import { cached } from './util/cached'

export interface DataContextShellConfig {
  rootBus: EventEmitter
}

// Used in places where we have to create a "shell" data context,
// for non-unified parts of the codebase
export class DataContextShell {
  private _gqlServer?: Server
  private _appServerPort: number | undefined
  private _gqlServerPort: number | undefined

  constructor (private shellConfig: DataContextShellConfig = { rootBus: new EventEmitter }) {}

  setAppServerPort (port: number | undefined) {
    this._appServerPort = port
  }

  setGqlServer (srv: Server) {
    this._gqlServer = srv
    this._gqlServerPort = (srv.address() as AddressInfo).port
  }

  get appServerPort () {
    return this._appServerPort
  }

  get gqlServerPort () {
    return this._gqlServerPort
  }

  @cached
  get emitter () {
    return new DataEmitterActions(this)
  }

  get _apis () {
    return {
      busApi: this.shellConfig.rootBus,
    }
  }

  destroy () {
    this._gqlServer?.close()
  }
}
