import NodeWebSocket from 'ws-8'

export class WebdriverWebSocket {
  static create (
    url: string,
  ): Promise<WebdriverWebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new NodeWebSocket(url, [], {
        followRedirects: true,
        perMessageDeflate: false,
        allowSynchronousEvents: false,
        maxPayload: 256 * 1024 * 1024, // 256Mb
      })

      ws.addEventListener('open', () => {
        return resolve(new WebdriverWebSocket(ws))
      })

      ws.addEventListener('error', (a) => {
        debugger
        reject(a)
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
        this.onmessage.call(null, event.data)
      }
    })

    this.#ws.addEventListener('close', () => {
      if (this.onclose) {
        this.onclose.call(null)
      }
    })

    this.#ws.addEventListener('error', () => {
      // debug
    })
  }

  send (message: string): void {
    this.#ws.send(message)
  }

  close (): void {
    this.#ws.close()
  }
}
