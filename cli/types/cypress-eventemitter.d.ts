// Cypress, cy, Log inherits EventEmitter.
type EventEmitter2 = import("eventemitter2").EventEmitter2

type event = import("eventemitter2").event
type eventNS = import("eventemitter2").eventNS
type ListenerFn = import("eventemitter2").ListenerFn
type Listener = import("eventemitter2").Listener
type OnOptions = import("eventemitter2").OnOptions

interface CyActions extends Cypress.Actions {
  (event: event | eventNS, listener: ListenerFn, options?: boolean|OnOptions): this|Listener
}

interface CyEventEmitter {
  once: CyActions
  on: CyActions
  off: CyActions
  emit: EventEmitter2['emit']
  removeListener: EventEmitter2['removeListener']
  removeAllListeners: EventEmitter2['removeAllListeners']
  proxyTo: (cy: Cypress.cy) => null
  emitMap: (eventName: string, args: any[]) => Array<(...args: any[]) => any>
  emitThen: (eventName: string, args: any[]) => Bluebird.BluebirdStatic
}

// Copied from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/events.d.ts
// to avoid type conflict.
interface NodeEventEmitter {
  addListener(event: string | symbol, listener: (...args: any[]) => void): this
  on(event: string | symbol, listener: (...args: any[]) => void): this
  once(event: string | symbol, listener: (...args: any[]) => void): this
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this
  off(event: string | symbol, listener: (...args: any[]) => void): this
  removeAllListeners(event?: string | symbol): this
  setMaxListeners(n: number): this
  getMaxListeners(): number
  listeners(event: string | symbol): Array<(...args: any[]) => void>
  rawListeners(event: string | symbol): Array<(...args: any[]) => void>
  emit(event: string | symbol, ...args: any[]): boolean
  listenerCount(type: string | symbol): number
  // Added in Node 6...
  prependListener(event: string | symbol, listener: (...args: any[]) => void): this
  prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this
  eventNames(): Array<string | symbol>
}

// We use the Buffer class for dealing with binary data, especially around the
// selectFile interface.
type BufferType = typeof import("buffer/").Buffer
