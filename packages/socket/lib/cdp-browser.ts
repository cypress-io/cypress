/// <reference lib="dom" />
import Emitter from 'component-emitter'
import { v4 as uuidv4 } from 'uuid'
import { decode, encode } from './utils'

export class CDPBrowserSocket extends Emitter {
  private _namespace: string

  constructor (namespace: string) {
    super()

    this._namespace = namespace

    const send = (payload: string) => {
      // console.log(`[${this._namespace}] send called with`, event, args)
      const parsed = JSON.parse(payload)

      decode(parsed).then((decoded: any) => {
        const [event, callbackEvent, args] = decoded

        super.emit(event, ...args)
        this.emit(callbackEvent, ...args)
      })
    }

    // @ts-ignore
    if (!window[`cypressSocket-${this._namespace}`]) {
      // @ts-ignore
      window[`cypressSocket-${this._namespace}`] = {}
    }

    // @ts-ignore
    if (!window[`cypressSocket-${this._namespace}`].send) {
      // @ts-ignore
      window[`cypressSocket-${this._namespace}`].send = send
    }

    // TODO: why do we need this? What's the signal we're looking for?
    setTimeout(() => {
      super.emit('connect')
    }, 50)
  }

  emit = (event: string, ...args: any[]) => {
    // Generate a unique key for this event
    const uuid = uuidv4()
    const key = `${event}-${uuid}`
    let callback

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
    }

    if (callback) {
      this.once(key, callback)
    }

    encode([event, key, args], this._namespace).then((encoded: any) => {
      // @ts-ignore
      window[`cypressSendToServer-${this._namespace}`](JSON.stringify(encoded))
    })

    return this
  }
}
