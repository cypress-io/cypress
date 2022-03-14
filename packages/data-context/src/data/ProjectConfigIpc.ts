/* eslint-disable no-dupe-class-members */
import type { CypressError } from '@packages/errors'
import type { SerializedLoadConfigReply, SetupNodeEventsReply, TestingType } from '@packages/types'
import type { ChildProcess } from 'child_process'
import EventEmitter from 'events'

export type IpcHandler = (ipc: ProjectConfigIpc) => void

/**
 * The ProjectConfigIpc is an EventEmitter wrapping the childProcess,
 * adding a "send" method for sending events from the parent process into the childProcess,
 *
 */
export class ProjectConfigIpc extends EventEmitter {
  private _destroyed = false

  constructor (readonly childProcess: ChildProcess) {
    super()

    childProcess.on('message', (msg: { event: string, args: any[] }) => {
      this.emit(msg.event, ...msg.args)
    })
  }

  destroy () {
    this._destroyed = true
    this.removeAllListeners()
  }

  // TODO: options => Cypress.TestingTypeOptions
  send(event: 'execute:plugins', evt: string, ids: {eventId: string, invocationId: string}, args: any[]): boolean
  send(event: 'setupTestingType', testingType: TestingType, options: Cypress.PluginConfigOptions): boolean
  send(event: 'loadConfig'): boolean
  send (event: string, ...args: any[]) {
    if (this._destroyed) {
      return false
    }

    try {
      return this.childProcess.send({ event, args })
    } catch (e) {
      this.emit('error', e)

      return false
    }
  }

  on(evt: 'childProcess:unhandledError', listener: (err: CypressError) => void): this

  on(evt: 'warning', listener: (warningErr: CypressError) => void): this
  on (evt: string, listener: (...args: any[]) => void) {
    return super.on(evt, listener)
  }

  once(evt: `promise:fulfilled:${string}`, listener: (err: any, value: any) => void): this

  /**
   * When the config is loaded, it comes back with either a "reply", or an "error" if there was a problem
   * sourcing the config (script error, etc.)
   */
  once(evt: 'ready', listener: () => void): this
  once(evt: 'loadConfig:reply', listener: (payload: SerializedLoadConfigReply) => void): this
  once(evt: 'loadConfig:error', listener: (err: CypressError) => void): this

  once(evt: 'error', listener: (err: Error) => void): this
  once(evt: 'setupTestingType:reply', listener: (payload: SetupNodeEventsReply) => void): this
  once(evt: 'setupTestingType:error', listener: (error: CypressError) => void): this
  once (evt: string, listener: (...args: any[]) => void) {
    return super.once(evt, listener)
  }

  emit (evt: string, ...args: any[]) {
    return super.emit(evt, ...args)
  }
}
