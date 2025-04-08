import type { CDPClient } from '@packages/types/src/protocol'
import type Protocol from 'devtools-protocol/types/protocol.d'
import { EventEmitter } from 'stream'
import { randomUUID } from 'crypto'
import { decode, encode } from './utils'
import Debug from 'debug'

const debugVerbose = Debug('cypress-verbose:server:socket:cdp-socket')

/**
 * The goal of this class is to emulate the socket io server API, but using the Chrome DevTools Protocol.
 */
export class CDPSocketServer extends EventEmitter {
  private _cdpSocket?: CDPSocket
  private _fullNamespace: string
  private _path?: string
  private _namespaceMap: Record<string, CDPSocketServer> = {}

  constructor ({ path = '', namespace = '/default' } = {}) {
    super()

    this._path = path
    this._fullNamespace = `${path}${namespace}`
  }

  async attachCDPClient (cdpClient: CDPClient): Promise<void> {
    this._cdpSocket = await CDPSocket.init(cdpClient, this._fullNamespace)

    await Promise.all(Object.values(this._namespaceMap).map(async (server) => {
      return server.attachCDPClient(cdpClient)
    }))

    // Simulate a connection event
    super.emit('connection', this._cdpSocket)
  }

  // @ts-expect-error TODO: fix emit type
  emit = async (event: string, ...args: any[]) => {
    this._cdpSocket?.emit(event, ...args)

    return true
  }

  of (namespace: string): CDPSocketServer {
    const fullNamespace = `${this._path}${namespace}`

    let server = this._namespaceMap[fullNamespace]

    if (!server) {
      server = new CDPSocketServer({ path: this._path, namespace })
      this._namespaceMap[fullNamespace] = server
    }

    return server
  }

  // We want to match the socket io API, but we don't really need to support rooms, so we are just passing along the existing server in this case.
  to (): CDPSocketServer {
    return this
  }

  close (): void {
    this._cdpSocket?.close()
    this.removeAllListeners()
    this._cdpSocket = undefined

    Object.values(this._namespaceMap).forEach((server) => {
      server.close()
    })
  }

  disconnectSockets (close?: boolean): void {
    this.close()
  }
}

export class CDPSocket extends EventEmitter {
  private _cdpClient?: CDPClient
  private _namespace: string
  private _executionContextId?: number

  constructor (cdpClient: CDPClient, namespace: string) {
    super()

    this._cdpClient = cdpClient
    this._namespace = namespace

    this._cdpClient.on('Runtime.bindingCalled', this.processCDPRuntimeBinding)
  }

  static async init (cdpClient: CDPClient, namespace: string): Promise<CDPSocket> {
    await cdpClient.send('Runtime.enable')
    await cdpClient.send('Runtime.addBinding', {
      name: `cypressSendToServer-${namespace}`,
    })

    return new CDPSocket(cdpClient, namespace)
  }

  join = (): void => {
    return
  }

  // @ts-expect-error TODO: fix emit type
  emit = async (event: string, ...args: any[]) => {
    // Generate a unique callback event name
    const uuid = randomUUID()
    let callback: ((...args: any[]) => void) | undefined

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
    }

    if (callback) {
      this.once(uuid, callback)
    }

    await encode([event, uuid, args], this._namespace).then((encoded: any) => {
      const expression = `
        if (window['cypressSocket-${this._namespace}'] && window['cypressSocket-${this._namespace}'].send) {
          window['cypressSocket-${this._namespace}'].send('${JSON.stringify(encoded).replaceAll('\\', '\\\\').replaceAll('\'', '\\\'')}')
        }
      `

      debugVerbose('sending message to browser %o', { expression })

      this._cdpClient?.send('Runtime.evaluate', { expression, contextId: this._executionContextId }).then((result) => {
        debugVerbose('successfully sent message to browser %o', result)
      }).catch((error) => {
        debugVerbose('error sending message to browser %o', { error })
      })
    })

    return true
  }

  disconnect = () => {
    this.close()
  }

  get connected (): boolean {
    return !!this._cdpClient
  }

  close = () => {
    this._cdpClient?.off('Runtime.bindingCalled', this.processCDPRuntimeBinding)
    this._cdpClient = undefined
  }

  private processCDPRuntimeBinding = async (bindingCalledEvent: Protocol.Runtime.BindingCalledEvent) => {
    const { name, payload } = bindingCalledEvent

    if (name !== `cypressSendToServer-${this._namespace}`) {
      return
    }

    debugVerbose('received message from browser %o', { payload })

    this._executionContextId = bindingCalledEvent.executionContextId

    const data = JSON.parse(payload)

    await decode(data).then((decoded: any) => {
      const [event, callbackEvent, args] = decoded

      const callback = async (...callbackArgs: any[]) => {
        debugVerbose('emitting callback from browser %o', { callbackEvent, callbackArgs })
        await this.emit(callbackEvent, ...callbackArgs)
      }

      debugVerbose('emitting message from browser %o', { event, callbackEvent, args })

      super.emit(event, ...args, callback)
    })
  }
}
