/* eslint-disable no-dupe-class-members */
import type { TestingType } from '@packages/types'
import type { ChildProcess } from 'child_process'
import EventEmitter from 'events'
import { autoBindDebug } from '../util'

export type IpcHandler = (ipc: ProjectConfigIpc) => void

export interface SetupNodeEventsReply {
  setupConfig: Cypress.ConfigOptions | null
  requires: string[]
  registrations: Array<{event: string, eventId: string}>
}

export interface LoadConfigReply {
  initialConfig: Cypress.ConfigOptions
  requires: string[]
}

export interface SerializedLoadConfigReply {
  initialConfig: string // stringified Cypress.ConfigOptions
  requires: string[]
}

export interface WarningError {
  name: 'Error'
  message: string
  stack: string
}

/**
 * The ProjectConfigIpc is an EventEmitter wrapping the childProcess,
 * adding a "send" method for sending events from the parent process into the childProcess,
 *
 */
export class ProjectConfigIpc extends EventEmitter {
  constructor (readonly childProcess: ChildProcess) {
    super()
    childProcess.on('error', (err) => {
      // this.emit('error', err)
    })

    childProcess.on('message', (msg: { event: string, args: any[] }) => {
      this.emit(msg.event, ...msg.args)
    })

    childProcess.once('disconnect', () => {
      // console.log('Disconnected')
      this.emit('disconnect')
    })

    return autoBindDebug(this)
  }

  // TODO: options => Cypress.TestingTypeOptions
  send(event: 'execute:plugins', evt: string, ids: {eventId: string, invocationId: string}, args: any[]): boolean
  send(event: 'setupTestingType', testingType: TestingType, options: Cypress.PluginConfigOptions): boolean
  send(event: 'loadConfig'): boolean
  send (event: string, ...args: any[]) {
    if (this.childProcess.killed) {
      return false
    }

    return this.childProcess.send({ event, args })
  }

  on(evt: 'childProcess:unhandledError', listener: (err: WarningError) => void): this

  on(evt: 'setupTestingType:uncaughtError', listener: (err: Error) => void): this
  on(evt: 'warning', listener: (warningErr: WarningError) => void): this
  on (evt: string, listener: (...args: any[]) => void) {
    return super.on(evt, listener)
  }

  once(evt: `promise:fulfilled:${string}`, listener: (err: any, value: any) => void): this

  /**
   * When the config is loaded, it comes back with either a "reply", or an "error" if there was a problem
   * sourcing the config (script error, etc.)
   */
  once(evt: 'loadConfig:reply', listener: (payload: SerializedLoadConfigReply) => void): this
  once(evt: 'loadConfig:error', listener: (realErrorCode: string, requiredFile: string, message: string) => void): this

  /**
   * When
   */
  once(evt: 'setupTestingType:reply', listener: (payload: SetupNodeEventsReply) => void): this
  once(evt: 'setupTestingType:error', listener: (error: string, requiredFile: string, stack: string) => void): this
  once (evt: string, listener: (...args: any[]) => void) {
    return super.once(evt, listener)
  }

  emit (evt: string, ...args: any[]) {
    return super.emit(evt, ...args)
  }
}
