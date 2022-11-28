/* eslint-disable no-dupe-class-members */
import EventEmitter from 'events'
import type { DataContext } from './DataContext'

type MenuItem = 'log:out'

/**
 * Because most of the original server modules contain local state
 * that will require incremental refactoring, we create a global "typed"
 * EventEmitter which we import and listen on the "cleanup" event in order
 * to reset the global state for testing / resetting when there is an error
 */
export class GlobalPubSub extends EventEmitter {
  on(msg: 'reset:data-context', listener: (ctx: DataContext) => void): this
  on(msg: 'menu:item:clicked', listener: (item: MenuItem) => void): this
  on(msg: 'test:cleanup', listener: (...args: any[]) => void): this
  on (msg: string, listener: (...args: any[]) => void) {
    return super.on(msg, listener)
  }

  emit(msg: 'menu:item:clicked', arg: MenuItem): boolean
  emit(msg: 'reset:data-context', arg: DataContext): boolean
  emit (msg: string, ...args: any[]) {
    return super.emit(msg, ...args)
  }

  emitThen(msg: 'test:cleanup'): Promise<void>
  async emitThen (msg: string, ...args: any[]): Promise<void> {
    // @ts-expect-error
    const events = this._events
    const handlers = events[msg] as Function | Function[]

    if (!handlers) {
      return Promise.resolve()
    }

    if (typeof handlers === 'function') {
      return await handlers()
    }

    const toAwait: Promise<any>[] = []

    for (const handler of handlers) {
      const result = handler()

      if (result && typeof result.then === 'function') {
        toAwait.push(result)
      }
    }

    await Promise.all(toAwait)
  }
}

export const globalPubSub = new GlobalPubSub()
