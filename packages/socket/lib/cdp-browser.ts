/// <reference lib="dom" />
import Emitter from 'component-emitter'
import * as parser from 'socket.io-parser'
import { v4 as uuidv4 } from 'uuid'

export class CDPBrowserSocket extends Emitter {
  private _namespace: string

  constructor (namespace: string) {
    super()

    this._namespace = namespace

    const send = (payload: string) => {
      return new Promise<void>((resolve) => {
        // console.log(`[${this._namespace}] send called with`, event, args)
        const parsed = JSON.parse(payload)
        const decoder = new parser.Decoder()

        decoder.on('decoded', (packet: any) => {
          const [event, callbackEvent, args] = packet.data

          // console.log(`[${this._namespace}] received event`, event, callbackEvent, args)

          const callback = (...cbArgs: any) => {
            this.emit(callbackEvent, ...cbArgs)

            resolve()
          }

          super.emit(event, ...args, callback)
        })

        parsed.forEach((packet: any) => {
          decoder.add(packet)
        })
      })
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

    const encoder = new parser.Encoder()
    const data = encoder.encode({
      type: parser.PacketType.EVENT,
      data: [event, key, args],
      nsp: this._namespace,
    })

    window[`cypressSendToServer-${this._namespace}`](JSON.stringify(data))

    return this
  }
}
