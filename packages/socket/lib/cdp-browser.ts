/// <reference lib="dom" />
import { EventEmitter } from 'events'

export class CDPBrowserSocket extends EventEmitter {
  private _namespace: string

  constructor (namespace: string) {
    super()

    this._namespace = namespace

    const send = (event: string, callbackEvent: string, args: string) => {
      // console.log(`[${this._namespace}] send called with`, event, args)
      const parsed = JSON.parse(args)

      const callback = (...cbArgs: any) => {
        this.emit(callbackEvent, ...cbArgs)
      }

      super.emit(event, ...parsed, callback)
    }

    if (!window[`cypressSocket-${this._namespace}`]) {
      window[`cypressSocket-${this._namespace}`] = {}
    }

    if (!window[`cypressSocket-${this._namespace}`].send) {
      window[`cypressSocket-${this._namespace}`].send = send
    }

    // TODO: why do we need this? What's the signal we're looking for?
    setTimeout(() => {
      super.emit('connect')
    }, 1)
  }

  emit = (event: string, ...args: any[]) => {
    const key = `${event}-${performance.now()}`
    let callback

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
    }

    if (callback) {
      this.once(key, callback)
    }

    window[`cypressSendToServer-${this._namespace}`](JSON.stringify({
      event,
      callbackEvent: key,
      args,
    }))

    return true
  }

  hasListeners = (event: string) => {
    return super.listenerCount(event) > 0
  }
}
