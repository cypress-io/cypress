import type { CDPClient } from '@packages/types'
import type Protocol from 'devtools-protocol/types/protocol.d'
import { EventEmitter } from 'stream'
import * as parser from 'socket.io-parser'
import { randomUUID } from 'crypto'

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

    super.emit('connection', this._cdpSocket)
  }

  emit = (event: string, ...args: any[]) => {
    this._cdpSocket?.emit(event, ...args)

    return true
  }

  of (namespace: string): CDPSocketServer {
    const fullNamespace = `${this._path}${namespace}`

    if (!this._namespaceMap[fullNamespace]) {
      this._namespaceMap[fullNamespace] = new CDPSocketServer({ path: this._path, namespace })
    }

    return this._namespaceMap[fullNamespace]
  }

  to (room: string): CDPSocketServer {
    return this
  }

  // TODO: figure out end lifecycle/disconnects/etc.
  close (): void {
    this._cdpSocket?.close()
    this.removeAllListeners()
    this._cdpSocket = undefined

    Object.values(this._namespaceMap).forEach((server) => {
      server.close()
    })
  }

  // TODO: figure out end lifecycle/disconnects/etc.
  disconnectSockets (close?: boolean): void {
    this._cdpSocket?.close()
    this.removeAllListeners()
    this._cdpSocket = undefined

    Object.values(this._namespaceMap).forEach((server) => {
      server.disconnectSockets()
    })
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

  join = (room: string): void => {
    return
  }

  emit = (event: string, ...args: any[]) => {
    // Generate a unique callback event name
    const uuid = randomUUID()
    const callbackEvent = `${event}-${uuid}`
    let callback

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
    }

    const encoder = new parser.Encoder()
    const data = encoder.encode({
      type: parser.PacketType.EVENT,
      data: [event, callbackEvent, args],
      nsp: this._namespace,
    })

    const expression = `
      if (window['cypressSocket-${this._namespace}'] && window['cypressSocket-${this._namespace}'].send) {
        window['cypressSocket-${this._namespace}'].send('${JSON.stringify(data).replaceAll('\\', '\\\\').replaceAll('\'', '\\\'')}')
      }
    `

    if (callback) {
      this.once(callbackEvent, callback)
    }

    // console.trace()
    // console.log('sending CDP socket event', event, callbackEvent, args)

    this._cdpClient?.send('Runtime.evaluate', { expression, contextId: this._executionContextId })

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

    this._executionContextId = bindingCalledEvent.executionContextId

    const packets = JSON.parse(payload)

    const decoder = new parser.Decoder()

    const decoderPromise = new Promise((resolve) => {
      decoder.on('decoded', (packet: any) => {
        resolve(packet)
      })
    })

    // console.log('CDPSocketServer: processCDPRuntimeBinding', packets)

    packets.forEach((packet: any) => {
      try {
      decoder.add(packet)
      } catch (error) {
        // Do nothing
        console.log('error decoding the packet, likely this is binary data', error)
      }
    })

    const parsed = await decoderPromise as any

    // TODO: be smarter about this
    const [event, callbackEvent, args] = parsed.data

    // console.log('CDPSocketServer: processCDPRuntimeBinding', event, callbackEvent, args)

    const callback = (...callbackArgs: any[]) => {
      this.emit(callbackEvent, ...callbackArgs)
    }

    super.emit(event, ...args, callback)
  }
}
