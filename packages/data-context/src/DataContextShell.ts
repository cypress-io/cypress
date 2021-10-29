import { EventEmitter } from 'events'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import { DataEmitterActions } from './actions/DataEmitterActions'
import { cached } from './util/cached'
import { CoreDataShape, makeCoreData } from './data/coreDataShape'

export interface DataContextShellConfig {
  rootBus: EventEmitter
    /**
   * Default is to
   */
     coreData?: CoreDataShape
}

// Used in places where we have to create a "shell" data context,
// for non-unified parts of the codebase
export class DataContextShell {
  private _gqlServer?: Server
  private _appServerPort: number | undefined
  private _gqlServerPort: number | undefined
  private _coreData: CoreDataShape

  constructor (private shellConfig: DataContextShellConfig = { rootBus: new EventEmitter }) {
    this._coreData = shellConfig.coreData ?? makeCoreData()
  }

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

  get coreData () {
    return this._coreData
  }

  destroy () {
    this._gqlServer?.close()
  }
}
