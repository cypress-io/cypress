import type Protocol from 'devtools-protocol/types/protocol.d'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping.d'
import { EventEmitter } from 'stream'
import { randomUUID } from 'crypto'
import { decode, encode } from '../utils'
import Debug from 'debug'

const debugVerbose = Debug('cypress-verbose:server:socket:cdp-socket')

/**
 * The subset of the CDP surface this socket needs. Satisfied by a real CDP
 * client (Chromium) or by an adapter over another automation protocol that can
 * expose a window binding and evaluate script (e.g. Playwright for WebKit).
 */
export interface CDPSocketBridge {
  send (command: 'Page.enable' | 'Page.getFrameTree' | 'Runtime.enable' | 'Runtime.addBinding' | 'Runtime.evaluate', params?: object): Promise<any>
  on<E extends CDPSocketBridgeEvent> (event: E, listener: (event: CDPSocketBridgeEventPayload<E>) => void): void
  off<E extends CDPSocketBridgeEvent> (event: E, listener: (event: CDPSocketBridgeEventPayload<E>) => void): void
}

export type CDPSocketBridgeEvent =
  | 'Runtime.bindingCalled'
  | 'Runtime.executionContextCreated'
  | 'Runtime.executionContextDestroyed'
  | 'Runtime.executionContextsCleared'
  | 'Page.frameAttached'
  | 'Page.frameDetached'

export type CDPSocketBridgeEventPayload<E extends CDPSocketBridgeEvent> = ProtocolMapping.Events[E][0]

interface CDPSocketServerOptions {
  path?: string
  namespace?: string
  isTrustedOrigin: (origin: string) => boolean
  // Cypress-in-Cypress runs the inner runner in the outer runner's AUT frame, a child of the main frame
  allowMainFrameChildren?: boolean
}

/**
 * The binding is installed in every frame of the page, but only the runner's
 * top document may call it.
 */
class BindingCallerContexts {
  // frame ids of the contexts at a trusted origin, in creation order
  private _trustedContexts = new Map<number, string | undefined>()
  private _mainFrameId?: string
  private _mainFrameChildren = new Set<string>()

  constructor (private _cdpClient: CDPSocketBridge, private _options: Pick<CDPSocketServerOptions, 'isTrustedOrigin' | 'allowMainFrameChildren'>) {}

  async attach (): Promise<void> {
    this._cdpClient.on('Runtime.executionContextCreated', this._onContextCreated)
    this._cdpClient.on('Runtime.executionContextDestroyed', this._onContextDestroyed)
    this._cdpClient.on('Runtime.executionContextsCleared', this._onContextsCleared)

    if (this._options.allowMainFrameChildren) {
      this._cdpClient.on('Page.frameAttached', this._onFrameAttached)
      this._cdpClient.on('Page.frameDetached', this._onFrameDetached)
      await this._cdpClient.send('Page.enable')
    }

    const { frameTree }: Protocol.Page.GetFrameTreeResponse = await this._cdpClient.send('Page.getFrameTree')

    this._mainFrameId = frameTree.frame.id
    frameTree.childFrames?.forEach(({ frame }) => this._mainFrameChildren.add(frame.id))

    // replays the contexts that already exist, so the listeners must be in place first
    await this._cdpClient.send('Runtime.enable')
  }

  detach (): void {
    this._cdpClient.off('Runtime.executionContextCreated', this._onContextCreated)
    this._cdpClient.off('Runtime.executionContextDestroyed', this._onContextDestroyed)
    this._cdpClient.off('Runtime.executionContextsCleared', this._onContextsCleared)
    this._cdpClient.off('Page.frameAttached', this._onFrameAttached)
    this._cdpClient.off('Page.frameDetached', this._onFrameDetached)
    this._trustedContexts.clear()
  }

  isAllowed (executionContextId: number): boolean {
    return this._trustedContexts.has(executionContextId) && this._mayHostRunner(this._trustedContexts.get(executionContextId))
  }

  latestAllowed (): number | undefined {
    return [...this._trustedContexts.keys()].reverse().find((id) => this.isAllowed(id))
  }

  // frames are unknown until the frame tree arrives, so contexts created before then are kept
  private _mayHostRunner (frameId?: string): boolean {
    if (!this._mainFrameId) {
      return true
    }

    return frameId === this._mainFrameId || (!!this._options.allowMainFrameChildren && !!frameId && this._mainFrameChildren.has(frameId))
  }

  private _onContextCreated = ({ context }: Protocol.Runtime.ExecutionContextCreatedEvent) => {
    // a child's context can arrive before its frameAttached, so isAllowed checks the frame at call time
    const mayHostRunner = this._options.allowMainFrameChildren || this._mayHostRunner(context.auxData?.frameId)

    if (!context.auxData?.isDefault || !mayHostRunner) {
      return
    }

    // Judged once per document: re-judging per message would drop the runner's own
    // messages while cy.visit has moved the primary origin but top has not navigated yet
    if (this._options.isTrustedOrigin(context.origin)) {
      this._trustedContexts.set(context.id, context.auxData.frameId)
    }
  }

  private _onContextDestroyed = ({ executionContextId }: Protocol.Runtime.ExecutionContextDestroyedEvent) => {
    this._trustedContexts.delete(executionContextId)
  }

  private _onContextsCleared = () => {
    this._trustedContexts.clear()
  }

  private _onFrameAttached = ({ frameId, parentFrameId }: Protocol.Page.FrameAttachedEvent) => {
    if (parentFrameId === this._mainFrameId) {
      this._mainFrameChildren.add(frameId)
    }
  }

  private _onFrameDetached = ({ frameId }: Protocol.Page.FrameDetachedEvent) => {
    this._mainFrameChildren.delete(frameId)
  }
}

/**
 * The goal of this class is to emulate the socket io server API, but using the Chrome DevTools Protocol.
 */
export class CDPSocketServer extends EventEmitter {
  private _cdpSocket?: CDPSocket
  private _fullNamespace: string
  private _path?: string
  private _namespaceMap: Record<string, CDPSocketServer> = {}
  private _options: CDPSocketServerOptions
  private _callerContexts?: BindingCallerContexts

  constructor (options: CDPSocketServerOptions) {
    super()

    // callers that build options untyped would otherwise only fail on the first page load
    if (typeof options.isTrustedOrigin !== 'function') {
      throw new Error('CDPSocketServer requires an isTrustedOrigin check')
    }

    const { path = '', namespace = '/default' } = options

    this._options = options
    this._path = path
    this._fullNamespace = `${path}${namespace}`
  }

  async attachCDPClient (cdpClient: CDPSocketBridge): Promise<void> {
    const callerContexts = new BindingCallerContexts(cdpClient, this._options)

    // the current socket keeps working until the new one is ready, and stays if attaching fails
    try {
      await callerContexts.attach()
    } catch (err) {
      callerContexts.detach()
      throw err
    }

    this._callerContexts?.detach()
    this._callerContexts = callerContexts

    await this._attach(cdpClient, callerContexts)
  }

  private async _attach (cdpClient: CDPSocketBridge, callerContexts: BindingCallerContexts): Promise<void> {
    // detach the previous socket so re-attaching (e.g. per spec) does not accumulate listeners on a long-lived client
    this._cdpSocket?.close()
    this._cdpSocket = await CDPSocket.init(cdpClient, this._fullNamespace, callerContexts)

    await Promise.all(Object.values(this._namespaceMap).map(async (server) => {
      return server._attach(cdpClient, callerContexts)
    }))

    // Simulate a connection event
    super.emit('connection', this._cdpSocket)
  }

  // @ts-expect-error - TODO: emit is async, so it returns a Promise where EventEmitter's emit returns boolean
  emit = async (event: string, ...args: any[]) => {
    // tslint:disable-next-line:no-floating-promises
    this._cdpSocket?.emit(event, ...args)

    return true
  }

  of (namespace: string): CDPSocketServer {
    const fullNamespace = `${this._path}${namespace}`

    let server = this._namespaceMap[fullNamespace]

    if (!server) {
      server = new CDPSocketServer({ ...this._options, path: this._path, namespace })
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
    this._callerContexts?.detach()
    this.removeAllListeners()
    this._cdpSocket = undefined
    this._callerContexts = undefined

    Object.values(this._namespaceMap).forEach((server) => {
      server.close()
    })
  }

  disconnectSockets (close?: boolean): void {
    this.close()
  }
}

export class CDPSocket extends EventEmitter {
  private _cdpClient?: CDPSocketBridge
  private _namespace: string
  private _executionContextId?: number
  private _callerContexts: BindingCallerContexts

  constructor (cdpClient: CDPSocketBridge, namespace: string, callerContexts: BindingCallerContexts) {
    super()

    this._cdpClient = cdpClient
    this._namespace = namespace
    this._callerContexts = callerContexts

    this._cdpClient.on('Runtime.bindingCalled', this.processCDPRuntimeBinding)
  }

  static async init (cdpClient: CDPSocketBridge, namespace: string, callerContexts: BindingCallerContexts): Promise<CDPSocket> {
    await cdpClient.send('Runtime.addBinding', {
      name: `cypressSendToServer-${namespace}`,
    })

    return new CDPSocket(cdpClient, namespace, callerContexts)
  }

  join = (): void => {
    return
  }

  // @ts-expect-error - TODO: emit is async, so it returns a Promise where EventEmitter's emit returns boolean
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

      const contextId = this._executionContextId !== undefined && this._callerContexts.isAllowed(this._executionContextId)
        ? this._executionContextId
        : this._callerContexts.latestAllowed()

      if (contextId === undefined) {
        debugVerbose('not sending message to browser, no runner context is known %o', { event })
        this.removeAllListeners(uuid)

        return
      }

      debugVerbose('sending message to browser %o', { expression, contextId })

      this._cdpClient?.send('Runtime.evaluate', { expression, contextId, returnByValue: true }).then((result) => {
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

    if (!this._callerContexts.isAllowed(bindingCalledEvent.executionContextId)) {
      debugVerbose('dropping message from a context outside the main frame or at an untrusted origin %o', { executionContextId: bindingCalledEvent.executionContextId })

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
