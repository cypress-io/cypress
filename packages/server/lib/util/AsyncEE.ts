import EE from 'events'

export default class AsyncEE extends EE {
  async emitThen (name, ...args) {
    // @ts-ignore
    const handlers: Function[] = [].concat((this._events)[name])

    for (const handler of handlers) {
      if (handler) {
        await handler(...args)
      }
    }
  }
}
