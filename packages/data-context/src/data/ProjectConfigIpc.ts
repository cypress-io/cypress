/* eslint-disable no-dupe-class-members */
import type { TestingType } from '@packages/types'
import type { ChildProcess } from 'child_process'
import EventEmitter from 'events'

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

/**
 * The ProjectConfigIpc is an EventEmitter wrapping the childProcess,
 * adding a "send" method for sending events from the parent process into the childProcess,
 *
 */
export class ProjectConfigIpc extends EventEmitter {
  constructor (private proc: ChildProcess) {
    super()
    proc.on('error', (err) => {
      this.emit('error', err)
    })

    proc.on('message', (msg: { event: string, args: any[] }) => {
      this.emit(msg.event, ...msg.args)
    })

    proc.once('disconnect', () => {
      this.emit('disconnect')
      proc.removeAllListeners()
    })
  }

  // TODO: options => Cypress.TestingTypeOptions
  send(event: 'execute:plugins', evt: string, ids: {eventId: string, invocationId: string}, args: any[]): boolean
  send(event: 'setupTestingType', testingType: TestingType, options: Cypress.PluginConfigOptions): boolean
  send(event: 'loadConfig'): boolean
  send (event: string, ...args: any[]) {
    if (this.proc.killed) {
      return false
    }

    return this.proc.send({ event, args })
  }

  /**
   * When the config is loaded, it comes back with either a "reply", or an "error" if there was a problem
   * sourcing the config (script error, etc.)
   */
  once(evt: 'loadConfig:reply', listener: (payload: LoadConfigReply) => void): this
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
