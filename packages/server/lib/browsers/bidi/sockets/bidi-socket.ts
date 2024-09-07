import Bluebird from 'bluebird'
import debugModule from 'debug'
import _ from 'lodash'
import { PrimitiveWebSocket } from './socket'
import { EventEmitter } from 'stream'

const debug = debugModule('cypress:server:browsers:bidi:sockets:bidi-socket')
const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi:sockets:bidi-socket')

export class BidiSocket {
  // maybe this should be static or a generator?
  #requestIdIncrementor = 0
  #biDiWebSocketUrl: string
  #commandCallbackMap: Map<number, (data: any) => any>
  #eventEmitter: EventEmitter
  #ws: PrimitiveWebSocket
  constructor (ws: PrimitiveWebSocket, biDiWebSocketUrl: string) {
    this.#ws = ws
    this.#biDiWebSocketUrl = biDiWebSocketUrl
    // eslint-disable-next-line no-spaced-func
    this.#commandCallbackMap = new Map<number, (data: any) => any>()
    this.#eventEmitter = new EventEmitter()

    this.registerOnMessage()
    this.registerOnClose()
  }

  private registerOnMessage () {
    this.#ws.onmessage = (data) => {
      if (data && _.isString(data)) {
        const formatted = JSON.parse(data)

        if (formatted?.id) {
          debugVerbose(`received response for request id:${formatted?.id}`)
          const cb = this.#commandCallbackMap.get(formatted?.id)

          if (cb) {
            debugVerbose(`removing callback mapped to request id:${formatted?.id}`)
            this.#commandCallbackMap.delete(formatted?.id)
            debugVerbose(`calling callback for request id:${formatted?.id}`)
            cb(formatted)

            return
          }
        } else if (formatted?.id !== undefined) {
          // need to check for undefined or else we will get spam in the debug logs from event messages
          debugVerbose(`callback for request id:${formatted?.id} not found`)
        }

        // if this is an event method and there is a registered listener, send the event
        if (formatted?.method) {
          if (this.#eventEmitter.listeners(formatted?.method).length) {
            debugVerbose(`emitting event ${formatted?.method}`)

            return this.#eventEmitter.emit(formatted?.method, formatted)
          }

          debugVerbose(`no event handler found for event ${formatted?.method}`)
        }
      }
    }
  }

  private registerOnClose () {
    this.#ws.onclose = () => {
      debug(`BidiSocket for ${this.#biDiWebSocketUrl} closed`)
    }
  }

  bindEvent <ParamType, ReturnType> (eventName: string, callback: (params: ParamType) => ReturnType) {
    return this.#eventEmitter.on(eventName, callback)
  }

  unbindEvent <ParamType, ReturnType> (eventName: string, callback: (params: ParamType) => ReturnType) {
    return this.#eventEmitter.off(eventName, callback)
  }

  sendCommand<ParamType, ReturnType> (params: ParamType & { id?: number }) {
    const callbackPromise = new Bluebird.Promise<ReturnType>((resolve, reject) => {
      const callback = (data: any) => {
        resolve(data as ReturnType)
      }

      // TODO: make #requestIdIncrementor a generator
      params.id = ++this.#requestIdIncrementor
      debugVerbose(`creating command callback for request id:${params.id}`)
      this.#commandCallbackMap.set(params.id, callback)
      debugVerbose(`sending command with request id:${params.id}`)
      this.#ws.send(JSON.stringify(params))
      // TODO: make this timeout configurable
    }).timeout(10000)

    return callbackPromise
  }

  static async create (biDiWebSocketUrl: string): Promise<BidiSocket> {
    const ws = await PrimitiveWebSocket.create(biDiWebSocketUrl)
    const socketWrapper = new BidiSocket(ws, biDiWebSocketUrl)

    return socketWrapper
  }
}
