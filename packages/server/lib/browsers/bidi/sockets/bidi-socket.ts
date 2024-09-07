import Bluebird from 'bluebird'
import debugModule from 'debug'
import _ from 'lodash'
import { PrimitiveWebSocket } from './socket'

const debug = debugModule('cypress:server:browsers:bidi:sockets:bidi-socket')
const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi:sockets:bidi-socket')

export class BidiSocket {
  // maybe this should be static or a generator?
  #requestIdIncrementor = 0
  #biDiWebSocketUrl: string
  #callbackMap
  #ws: PrimitiveWebSocket
  constructor (ws: PrimitiveWebSocket, biDiWebSocketUrl: string) {
    this.#ws = ws
    this.#biDiWebSocketUrl = biDiWebSocketUrl
    // eslint-disable-next-line no-spaced-func
    this.#callbackMap = new Map<number, (data: any) => any>()

    this.registerOnMessage()
    this.registerOnClose()
  }

  private registerOnMessage () {
    this.#ws.onmessage = (data) => {
      if (data && _.isString(data)) {
        const formatted = JSON.parse(data)

        debugVerbose(`received response for request id:${formatted?.id}`)
        const cb = this.#callbackMap.get(formatted?.id)

        if (cb) {
          debugVerbose(`removing callback mapped to request id:${formatted?.id}`)
          this.#callbackMap.delete(formatted?.id)
          debugVerbose(`calling callback for request id:${formatted?.id}`)
          cb(formatted)

          return
        }

        debugVerbose(`callback for request id:${formatted?.id} not found`)
      }
    }
  }

  private registerOnClose () {
    this.#ws.onclose = () => {
      debug(`BidiSocket for ${this.#biDiWebSocketUrl} closed`)
    }
  }

  request<ParamType, ReturnType> (params: ParamType & { id?: number }) {
    const callbackPromise = new Bluebird.Promise<ReturnType>((resolve, reject) => {
      const callback = (data: any) => {
        resolve(data as ReturnType)
      }

      params.id = ++this.#requestIdIncrementor
      debugVerbose(`creating callback for request id:${params.id}`)
      this.#callbackMap.set(params.id, callback)
      debugVerbose(`sending request id:${params.id}`)
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
