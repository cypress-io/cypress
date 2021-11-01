import { EventEmitter } from 'events'
import type { GraphQLSchema } from 'graphql'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import path from 'path'
import fsExtra from 'fs-extra'

import { DataEmitterActions } from './actions/DataEmitterActions'
import { GraphQLDataSource, HtmlDataSource, UtilDataSource } from './sources'
import { EnvDataSource } from './sources/EnvDataSource'
import { cached } from './util/cached'

export interface DataContextShellConfig {
  rootBus: EventEmitter
  schema: GraphQLSchema
}

// Used in places where we have to create a "shell" data context,
// for non-unified parts of the codebase
export class DataContextShell {
  private _gqlServer?: Server
  private _appServerPort: number | undefined
  private _gqlServerPort: number | undefined

  constructor (private shellConfig: DataContextShellConfig = { rootBus: new EventEmitter, schema: require('@packages/graphql').graphqlSchema }) {}

  @cached
  get fs () {
    return fsExtra
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
  get path () {
    return path
  }

  @cached
  get env () {
    return new EnvDataSource(this)
  }

  @cached
  get emitter () {
    return new DataEmitterActions(this)
  }

  graphqlClient () {
    return new GraphQLDataSource(this, this.shellConfig.schema)
  }

  @cached
  get html () {
    return new HtmlDataSource(this)
  }

  @cached
  get util () {
    return new UtilDataSource(this)
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
