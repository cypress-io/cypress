/* eslint-disable no-dupe-class-members */
import type { ChildProcess } from 'child_process'
import EventEmitter from 'events'
import type { CypressError } from '@packages/errors'
import type { LegacyCypressConfigJson } from '../sources'

export class LegacyPluginsIpc extends EventEmitter {
  constructor (readonly childProcess: ChildProcess) {
    super()
    childProcess.on('message', (msg: { event: string, args: any[] }) => {
      this.emit(msg.event, ...msg.args)
    })

    childProcess.once('disconnect', () => {
      this.emit('disconnect')
    })
  }

  send(event: 'loadLegacyPlugins', legacyConfig: LegacyCypressConfigJson): boolean
  send (event: string, ...args: any[]) {
    if (this.childProcess.killed || !this.childProcess.connected) {
      return false
    }

    return this.childProcess.send({ event, args })
  }

  on(event: 'ready', listener: () => void): this
  on(event: 'loadLegacyPlugins:error', listener: (error: CypressError) => void): this
  on(event: 'childProcess:unhandledError', listener: (legacyConfig: LegacyCypressConfigJson) => void): this
  on(event: 'loadLegacyPlugins:reply', listener: (legacyConfig: LegacyCypressConfigJson) => void): this
  on (evt: string, listener: (...args: any[]) => void) {
    return super.on(evt, listener)
  }

  killChildProcess () {
    this.childProcess.kill()
    this.childProcess.stdout?.removeAllListeners()
    this.childProcess.stderr?.removeAllListeners()
    this.childProcess.removeAllListeners()

    this.removeAllListeners()
  }
}
