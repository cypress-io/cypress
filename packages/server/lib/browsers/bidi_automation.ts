import type { Protocol } from 'devtools-protocol'
import debugModule from 'debug'
import { WebdriverWebSocket } from './webdriver_socket'

const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi_automation')

class BidiSocket {
  #requestIdIncrementor = 0

  #callbackMap
  #ws: WebdriverWebSocket
  constructor (ws: WebdriverWebSocket) {
    this.#ws = ws
    // eslint-disable-next-line no-spaced-func
    this.#callbackMap = new Map<number, (data: any) => any>()

    this.registerOnMessage()
    this.registerOnClose()
  }

  private registerOnMessage () {
    this.#ws.onmessage = (data) => {
      if (data) {
        const formatted = JSON.parse(data)
        const cb = this.#callbackMap.get(formatted?.id)

        if (cb) {
          this.#callbackMap.delete(formatted?.id)
          cb(formatted)
        }
      }
    }
  }

  private registerOnClose () {
    this.#ws.onclose = () => {
      // close this or something
    }
  }

  request (params: any) {
    const callbackPromise = new Promise((resolve, reject) => {
      const callback = (data: any) => {
        resolve(data)
        // TODO: add rejection after time
      }

      params.id = ++this.#requestIdIncrementor
      this.#callbackMap.set(params.id, callback)
      this.#ws.send(JSON.stringify(params))
    })

    return callbackPromise
  }

  static async create (biDiWebSocketUrl: string): Promise<BidiSocket> {
    const ws = await WebdriverWebSocket.create(`${biDiWebSocketUrl}/session`)
    const socketWrapper = new BidiSocket(ws)

    return socketWrapper
  }
}

export class BidiAutomation {
  #ws: BidiSocket
  private constructor (websocket: BidiSocket) {
    this.#ws = websocket

    // // https://w3c.github.io/webdriver-bidi/#event-network-beforeSendRequest
    // onFn('Network.requestWillBeSent', this.onNetworkRequestWillBeSent)
    // // https://w3c.github.io/webdriver-bidi/#event-network-responseCompleted
    // onFn('Network.responseReceived', this.onResponseReceived)
    // // onFn('Network.requestServedFromCache', this.onRequestServedFromCache)

    // // https://w3c.github.io/webdriver-bidi/#event-network-fetchError
    // onFn('Network.loadingFailed', this.onRequestFailed)

    // // https://w3c.github.io/webdriver-bidi/#event-script-realmCreated
    // // https://w3c.github.io/webdriver-bidi/#event-script-realmDestroyed
    // onFn('ServiceWorker.workerRegistrationUpdated', this.onServiceWorkerRegistrationUpdated)
    // onFn('ServiceWorker.workerVersionUpdated', this.onServiceWorkerVersionUpdated)

    // this.on = onFn
    // this.off = offFn
    // this.send = sendDebuggerCommandFn
  }

  async createNewSession (capabilities: any = {}) {
    const method = 'session.new'
    const params = {
      capabilities: {
        firstMatch: capabilities?.firstMatch,
        alwaysMatch: {
          ...capabilities?.alwaysMatch,
          acceptInsecureCerts: true,
          // webSocketUrl: true,
        },
      },
    }
    const payload = {
      method,
      params,
    }
    const session = await this.#ws.request(payload)

    return session
  }

  // possibly could do this to fix recording in firefox
  // https://w3c.github.io/webdriver-bidi/#command-browsingContext-captureScreenshot

  static async create (biDiWebSocketUrl: string): Promise<any> {
    const ws = await BidiSocket.create(biDiWebSocketUrl)
    const bidiAutomation = new BidiAutomation(ws)

    return bidiAutomation
  }
}
