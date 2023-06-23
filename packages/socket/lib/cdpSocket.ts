import type { Server, IncomingMessage } from 'http'
import type { Server as SocketIOBaseServer, ServerOptions, Socket, Namespace, BroadcastOperator, RemoteSocket } from 'socket.io'
import type { Adapter } from 'socket.io-adapter'
import type { Packet } from 'socket.io-parser'

import type { ExtendedError, NamespaceReservedEventsMap } from 'socket.io/dist/namespace'
import type { DefaultEventsMap } from 'socket.io/dist/typed-events'
import type { Client } from 'socket.io/dist/client'
import type { Handshake, SocketReservedEventsMap } from 'socket.io/dist/socket'
import { EventEmitter } from 'stream'

import { Decoder } from 'socket.io-parser'

export class CDPSocketServer extends EventEmitter implements SocketIOBaseServer {
  _cdpSocket?: any
  _namespace: string
  _namespaceMap: {[key: string]: CDPSocketServer}
  // sockets: Namespace<DefaultEventsMap, DefaultEventsMap>
  // _parser: typeof import('socket.io-parser')
  // encoder: Encoder
  // _nsps: Map<string, Namespace<DefaultEventsMap, DefaultEventsMap>>
  // _connectTimeout: number

  // constructor () {
  //   super()
  //   // this.sockets = new Namespace(undefined, 'string')
  //   // this._nsps = new Map
  // }

  constructor ({ namespace = 'default' } = {}) {
    super()
    this._namespace = namespace || 'default'
    this._namespaceMap = {}
  }

  async attachCDPClient (CDPClient: any): Promise<void> {
    this._cdpSocket = await CDPSocket.init(CDPClient, this._namespace)

    await Promise.all(Object.values(this._namespaceMap).map(async (server) => {
      return server.attachCDPClient(CDPClient)
    }))

    // console.log(`[${this._namespace}]calling connection`)
    super.emit('connection', this._cdpSocket)
  }

  emit (ev: string, ...args: any[]): boolean {
    this._cdpSocket?.emit(ev, ...args)

    return true
  }

  serveClient(v: boolean): this
  serveClient(): boolean //eslint-disable-line
  serveClient(v?: boolean | undefined): boolean | this //eslint-disable-line
  serveClient (v?: unknown): boolean | this { //eslint-disable-line
    throw new Error('Method not implemented.')
  }
  _checkNamespace (name: string, auth: { [key: string]: any }, fn: (nsp: false | Namespace<DefaultEventsMap, DefaultEventsMap>) => void): void {
    throw new Error('Method not implemented.')
  }
  path(v: string): this
  path(): string //eslint-disable-line
  path(v?: string | undefined): string | this //eslint-disable-line
  path (v?: unknown): string | this { //eslint-disable-line
    throw new Error('Method not implemented.')
  }
  connectTimeout(v: number): this
  connectTimeout(): number //eslint-disable-line
  connectTimeout(v?: number | undefined): number | this //eslint-disable-line
  connectTimeout (v?: unknown): number | this { //eslint-disable-line
    throw new Error('Method not implemented.')
  }

  adapter(): Adapter | undefined
  adapter(v: Adapter): this //eslint-disable-line
  adapter(v?: Adapter | undefined): this | Adapter | undefined //eslint-disable-line
  adapter (v?: unknown): this | typeof import('socket.io-adapter').Adapter | undefined { //eslint-disable-line
    throw new Error('Method not implemented.')
  }
  listen (srv: number | Server, opts?: Partial<ServerOptions> | undefined): this {
    throw new Error('Method not implemented.')
  }
  attach (srv: number | Server, opts?: Partial<ServerOptions> | undefined): this {
    throw new Error('Method not implemented.')
  }
  bind (engine: any): this {
    throw new Error('Method not implemented.')
  }
  of (name: string | RegExp | ((name: string, auth: { [key: string]: any }, fn: (err: Error | null, success: boolean) => void) => void), fn?: ((socket: Socket<DefaultEventsMap, DefaultEventsMap>) => void) | undefined): Namespace<DefaultEventsMap, DefaultEventsMap> {
    if (!this._namespaceMap[name]) {
      this._namespaceMap[name] = new CDPSocketServer({ namespace: name })
    }

    return this._namespaceMap[name]

    // throw new Error('Method not implemented.')

    // return this._cdpSocket
  }
  close (fn?: ((err?: Error | undefined) => void) | undefined): void {
    throw new Error('Method not implemented.')
  }
  use (fn: (socket: Socket<DefaultEventsMap, DefaultEventsMap>, next: (err?: ExtendedError | undefined) => void) => void): this {
    throw new Error('Method not implemented.')
  }
  to (room: string | string[]): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  in (room: string | string[]): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  except (name: string | string[]): SocketIOBaseServer<DefaultEventsMap, DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  send (...args: any[]): this {
    throw new Error('Method not implemented.')
  }
  write (...args: any[]): this {
    throw new Error('Method not implemented.')
  }
  allSockets (): Promise<Set<string>> {
    throw new Error('Method not implemented.')
  }
  compress (compress: boolean): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  get volatile (): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  get local (): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  fetchSockets (): Promise<RemoteSocket<DefaultEventsMap>[]> {
    throw new Error('Method not implemented.')
  }
  socketsJoin (room: string | string[]): void {
    throw new Error('Method not implemented.')
  }
  socketsLeave (room: string | string[]): void {
    throw new Error('Method not implemented.')
  }
  disconnectSockets (close?: boolean | undefined): void {
    throw new Error('Method not implemented.')
  }
  protected emitReserved<Ev extends 'connect' | 'connection'> (ev: Ev, ...args: Parameters<NamespaceReservedEventsMap<DefaultEventsMap, DefaultEventsMap>[Ev]>): boolean {
    throw new Error('Method not implemented.')
  }
  protected emitUntyped (ev: string, ...args: any[]): boolean {
    throw new Error('Method not implemented.')
  }
}

export class CDPSocket extends EventEmitter implements Socket {
  private _cdpClient
  private _namespace
  // private _sendFunction
  // nsp: Namespace<DefaultEventsMap, DefaultEventsMap>
  // client: Client<DefaultEventsMap, DefaultEventsMap>
  // id: string
  // handshake: Handshake
  // data: any
  // connected: boolean
  // disconnected: boolean

  private constructor (cdpClient: any, namespace: string) {
    super()
    this._cdpClient = cdpClient
    this._namespace = namespace
    // // setup binding
    // this._cdpClient.send('Runtime.addBinding', {
    //   name: 'cypressSendToServer',
    // }).then((val) => {
    //   console.log('result', val)
    //   const myData = 'hi mom'

    //   this._sendFunction = this._cdpClient.send('Runtime.evaluate', { expression: 'window.derp = \'hi mom\'' }).then((val) => {
    //     console.log('val', val)
    //   })

    //   this._sendFunction = this._cdpClient.send('Runtime.evaluate', { expression: 'console.log(\'i was here\')' }).then((val) => {
    //     console.log('val', val)
    //   })
    // })

    console.log(`[${namespace}] attach runtime binding`)
    this._cdpClient.on('Runtime.bindingCalled', (result: any) => {
      this.processCDPRuntimeBinding.call(this, result)
    })
  }

  static async init (cdpClient: any, namespace: string) {
    cdpClient.send('Runtime.enable')

    const result = await cdpClient.send('Runtime.addBinding', {
      name: `cypressSendToServer-${namespace}`,
    })

    // console.log(`[${namespace}] init`, result)

    return new CDPSocket(cdpClient, namespace)
  }

  async processCDPRuntimeBinding (raw: any) {
    // console.log(`[${this._namespace}] function args`, raw)
    const { payload } = raw

    const parsed = JSON.parse(payload)

    const decoder = new Decoder()

    decoder.on('decoded', (stuff: any) => {
      // console.log('stuff', stuff)
      const { event, callbackEvent, args } = stuff.data[0]

      // console.log(`[${this._namespace}] retrieved args`, args)

      const callback = (callbackArgs: any) => {
        this.emit(callbackEvent, callbackArgs)
      }

      super.emit(event, ...args, callback)
    })

    // console.log('parsed', parsed[0])

    decoder.add(parsed[0])

    // const parsed = JSON.parse(payload)

    // const { event, callbackEvent, argsElement } = parsed

    // console.log('payload', parsed)

    // const eventArgs = await this._cdpClient.send('Runtime.evaluate', { expression: `${argsElement}`, returnByValue: true })

    // console.log(`[${this._namespace}] retrieved args`, eventArgs.result.value)

    // const callback = (callbackArgs: any) => {
    //   this.emit(callbackEvent, callbackArgs)
    // }

    // super.emit(event, ...eventArgs.result.value, callback)
  }

  emit (ev: string, ...args: any[]): boolean {
    // console.log(`[${this._namespace}] server -> browser`, ev, args)

    const callbackEvent = `${ev}-${performance.now()}`
    let callback

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
    }

    const expression = `
      if (window['cypressSocket-${this._namespace}'] && window['cypressSocket-${this._namespace}'].send) {
        window['cypressSocket-${this._namespace}'].send('${ev}','${callbackEvent}','${JSON.stringify(args).replaceAll('\\', '\\\\')}')
      } else {
      }
    `

    if (callback) {
      this.once(callbackEvent, callback)
    }

    this._cdpClient.send('Runtime.evaluate', { expression }).then((...vals: any[]) => {
      // console.log(`[${this._namespace}] result of send for`, ev, vals)
    })

    return true
  }

  to (room: string | string[]): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  in (room: string | string[]): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  except (room: string | string[]): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  send (...args: any[]): this {
    throw new Error('Method not implemented.')
  }
  write (...args: any[]): this {
    throw new Error('Method not implemented.')
  }
  join (rooms: string | string[]): void | Promise<void> {
    return
    // throw new Error('Method not implemented.')
  }
  leave (room: string): void | Promise<void> {
    throw new Error('Method not implemented.')
  }
  _onconnect (): void {
    throw new Error('Method not implemented.')
  }
  _onpacket (packet: Packet): void {
    throw new Error('Method not implemented.')
  }
  _onerror (err: Error): void {
    throw new Error('Method not implemented.')
  }
  _onclose (reason: string): this | undefined {
    throw new Error('Method not implemented.')
  }
  _error (err: any): void {
    throw new Error('Method not implemented.')
  }
  disconnect (close?: boolean | undefined): this {
    throw new Error('Method not implemented.')
  }
  compress (compress: boolean): this {
    throw new Error('Method not implemented.')
  }
  get volatile (): this {
    throw new Error('Method not implemented.')
  }
  get broadcast (): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  get local (): BroadcastOperator<DefaultEventsMap> {
    throw new Error('Method not implemented.')
  }
  use (fn: (event: any[], next: (err?: Error | undefined) => void) => void): this {
    throw new Error('Method not implemented.')
  }
  get request (): IncomingMessage {
    return undefined
    // throw new Error('Method not implemented.')
  }
  get conn (): any {
    return { transport: { name: 'cdp' } }
    // throw new Error('Method not implemented.')
  }
  get rooms (): Set<string> {
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
  protected emitReserved<Ev extends 'disconnect' | 'disconnecting' | 'error'> (ev: Ev, ...args: Parameters<SocketReservedEventsMap[Ev]>): boolean {
    throw new Error('Method not implemented.')
  }
  protected emitUntyped (ev: string, ...args: any[]): boolean {
    throw new Error('Method not implemented.')
  }
}
