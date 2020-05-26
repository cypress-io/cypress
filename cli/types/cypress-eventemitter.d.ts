// Cypress, cy, Log inherits EventEmitter.
type EventEmitter2 = import("eventemitter2").EventEmitter2

interface EventEmitter extends EventEmitter2 {
  proxyTo: (cy: Cypress.cy) => null
  emitMap: (eventName: string, args: any[]) => Array<(...args: any[]) => any>
  emitThen: (eventName: string, args: any[]) => Bluebird.BluebirdStatic
}
