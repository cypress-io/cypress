import debugModule from 'debug'
import NodeWebSocket from 'ws'

const debug = debugModule('cypress:server:browsers:bidi:sockets:socket')
const debugVerbose = debugModule('cypress-verbose:server:browsers:bidi:sockets:socket')

export class PrimitiveWebSocket {
  static create (
    url: string,
  ): Promise<PrimitiveWebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new NodeWebSocket(url, [], {
        followRedirects: true,
        perMessageDeflate: false,
        // @ts-expect-error
        allowSynchronousEvents: false,
        maxPayload: 256 * 1024 * 1024, // 256Mb
      })

      ws.addEventListener('open', () => {
        debugVerbose(`${ws.url} open`)

        return resolve(new PrimitiveWebSocket(ws))
      })

      ws.addEventListener('error', (err) => {
        debug(`${ws.url} error: ${err}`)
        reject(err)
      })
    })
  }
  #ws: NodeWebSocket
  onmessage?: (message: NodeWebSocket.Data) => void
  onclose?: () => void

  constructor (ws: NodeWebSocket) {
    this.#ws = ws
    this.#ws.addEventListener('message', (event) => {
      if (this.onmessage) {
        debugVerbose(`${ws.url} message: ${event.data}`)
        this.onmessage.call(null, event.data)
      }
    })

    this.#ws.addEventListener('close', () => {
      if (this.onclose) {
        debugVerbose(`${ws.url} closed`)

        this.onclose.call(null)
      }
    })

    this.#ws.addEventListener('error', (err) => {
      debug(`${ws.url} error: ${err}`)
    })
  }

  send (message: string): void {
    debugVerbose(`${this.#ws.url} send: ${message}`)
    this.#ws.send(message)
  }

  close (): void {
    debugVerbose(`${this.#ws.url} close`)
    this.#ws.close()
  }
}
