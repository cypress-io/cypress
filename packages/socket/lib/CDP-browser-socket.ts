import type { Socket } from 'socket.io-client'
// import { DefaultEventsMap, EventsMap, StrictEventEmitter } from 'socket.io-client/build/typed-events'
import Emitter from 'component-emitter'
import parser from 'socket.io-parser'

declare global {
  interface Window {
    cypressSendToServer: (data: string) => void
    cypressSend: any
    cypressTesty: {
      send: any
    }
  }
}

// window.cypressReceivedFromBrowser = (data) => {
//   constJSON.parse(data)
// }

// console.log('setup cypress send function')

// window.cypressSend = () => {
//   window.cypressSendToServer('setup acknowledged')
//   console.log('send called with:')
// }

// if (window.cypressSendToServer) {
//   // window.cypressSendToServer(JSON.stringify({ value: 'binding found' }))
// }

export class CDPBrowserSocket extends Emitter implements Socket {
  private _namespace: string
  // io: Manager<DefaultEventsMap, DefaultEventsMap>
  // id: string
  // connected: boolean
  // disconnected: boolean
  // auth: { [key: string]: any } | ((cb: (data: object) => void) => void)
  // receiveBuffer: (readonly any[])[]
  // sendBuffer: Packet[]

  // @ts-ignore
  constructor (namespace) {
    // console.log(`[${namespace}] CDPBrowserSocket Created`)
    super()

    this._namespace = namespace
    const send = (event: string, callbackEvent: string, args: string) => {
      // console.log(`[${this._namespace}] send called with`, event, args)
      const parsed = JSON.parse(args)

      const callback = (args: any) => {
        this.emit(callbackEvent, args)
      }

      super.emit(event, ...parsed, callback)
    }

    // @ts-ignore
    if (!window[`cypressSocket-${this._namespace}`]) {
      // @ts-ignore
      window[`cypressSocket-${this._namespace}`] = {
        send,
      }
    }

    // @ts-ignore
    if (!window[`cypressSocket-${this._namespace}`].send) {
      // @ts-ignore
      window[`cypressSocket-${this._namespace}`].send = send
    }

    setTimeout(() => {
      super.emit('connect')
    }, 1000)
  }

  // @ts-ignore
  emit (event, ...args) {
    // console.log(`[${this._namespace}] browser -> server`, event, args)
    const key = `${event}-${performance.now()}`
    let callback

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
    }

    if (callback) {
      this.once(key, callback)
    }

    // const encoder = new parser.Encoder

    // console.log('stored', window[`cypressSocket-${this._namespace}`].transportArgs[key])
    // const encodedPacket = encoder.encode({
    //   type: parser.PacketType.EVENT,
    //   data: [{
    //     event,
    //     callbackEvent: key,
    //     args,
    //   }],
    //   id: 12,
    //   nsp: '/',
    // })

    // console.log('encoded packet', encodedPacket)

    // @ts-ignore
    // window[`cypressSendToServer-${this._namespace}`](JSON.stringify(encodedPacket))
    window[`cypressSendToServer-${this._namespace}`](JSON.stringify({
      event,
      callbackEvent: key,
      args,
    }))

    // window[`cypressSendToServer-${this._namespace}`](JSON.stringify({
    //   event,
    //   callbackEvent: key,
    //   argsElement: `window['cypressSocket-${this._namespace}'].transportArgs['${key}']`,
    //   packet: encoder.encode({
    //     type: parser.PacketType.EVENT,
    //     data: {
    //       event,
    //       callbackEvent: key,
    //       args,
    //     },
    //     id: 12,
    //     nsp: this._namespace,
    //   }),
    // }))
  }

  get active (): boolean {
    throw new Error('Method not implemented.')
  }
  connect (): this {
    throw new Error('Method not implemented.')
  }
  open (): this {
    throw new Error('Method not implemented.')
  }
  send (...args: any[]): this {
    throw new Error('Method not implemented.')
  }
  disconnect (): this {
    throw new Error('Method not implemented.')
  }
  close (): this {
    // console.log('ws close called')

    return this
    // throw new Error('Method not implemented.')
  }
  compress (compress: boolean): this {
    throw new Error('Method not implemented.')
  }
  get volatile (): this {
    throw new Error('Method not implemented.')
  }
  onAny (listener: (...args: any[]) => void): this {
    throw new Error('Method not implemented.')
  }
  prependAny (listener: (...args: any[]) => void): this {
    throw new Error('Method not implemented.')
  }
  offAny (listener?: ((...args: any[]) => void) | undefined): this {
    throw new Error('Method not implemented.')
  }
  listenersAny (): ((...args: any[]) => void)[] {
    throw new Error('Method not implemented.')
  }
}
