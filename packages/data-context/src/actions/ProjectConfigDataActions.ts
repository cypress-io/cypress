// import childProcess, { ChildProcess, ForkOptions } from 'child_process'
import _ from 'lodash'
import { EventEmitter } from 'events'
import pDefer from 'p-defer'

import type { DataContext } from '..'

/**
 * Manages the lifecycle of the Config sourcing & Plugin execution
 */
export class ProjectConfigDataActions {
  constructor (private ctx: DataContext) {}

  protected wrapIpc (aProcess: ChildProcess) {
    const emitter = new EventEmitter()

    aProcess.on('message', (message: { event: string, args: any}) => {
      return emitter.emit(message.event, ...message.args)
    })

    // prevent max listeners warning on ipc
    // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
    emitter.setMaxListeners(Infinity)

    return {
      send (event: string, ...args: any) {
        if (aProcess.killed) {
          return
        }

        return aProcess.send({
          event,
          args,
        })
      },

      on: emitter.on.bind(emitter),
      removeListener: emitter.removeListener.bind(emitter),
    }
  }
}
