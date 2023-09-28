/// <reference lib="dom" />
import Emitter from 'component-emitter'
import { v4 as uuidv4 } from 'uuid'
import { decode, encode } from './utils'
import type { SocketShape } from './types'

type CDPSocketNamespaceKey = `cypressSocket-${string}`
type CDPSendToServerNamespaceKey = `cypressSendToServer-${string}`

declare global {
  interface Window {
    [key: CDPSocketNamespaceKey]: { send?: (payload: string) => void }
    [key: CDPSendToServerNamespaceKey]: (payload: string) => void
  }
}

export class CDPBrowserSocket extends Emitter implements SocketShape {
  private _namespace: string

  constructor (namespace: string) {
    super()

    this._namespace = namespace

    const send = (payload: string) => {
      const parsed = JSON.parse(payload)

      decode(parsed).then((decoded: any) => {
        const [event, callbackEvent, args] = decoded

        super.emit(event, ...args)
        this.emit(callbackEvent)
      })
    }

    let cypressSocket = window[`cypressSocket-${this._namespace}`]

    if (!cypressSocket) {
      cypressSocket = {}
      window[`cypressSocket-${this._namespace}`] = cypressSocket
    }

    if (!cypressSocket.send) {
      cypressSocket.send = send
    }
  }

  connect () {
    // Set timeout so that the connect event is emitted after the constructor returns and the user has a chance to attach a listener
    setTimeout(() => {
      super.emit('connect')
    }, 0)
  }

  emit = (event: string, ...args: any[]) => {
    // Generate a unique key for this event
    const uuid = uuidv4()
    let callback

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
    }

    if (callback) {
      this.once(uuid, callback)
    }

    encode([event, uuid, args], this._namespace).then((encoded: any) => {
      window[`cypressSendToServer-${this._namespace}`](JSON.stringify(encoded))
    })

    return this
  }
}
