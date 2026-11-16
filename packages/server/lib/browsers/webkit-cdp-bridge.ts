import { EventEmitter } from 'events'
import Debug from 'debug'
import type playwright from 'playwright-webkit'
import type { CDPSocketBridge, CDPSocketBridgeEvent, CDPSocketBridgeEventPayload } from '@packages/socket'

const debug = Debug('cypress:server:browsers:webkit-cdp-bridge')
const debugVerbose = Debug('cypress-verbose:server:browsers:webkit-cdp-bridge')

// how long a single evaluation may hold up the ordering chain before later
// messages are dispatched anyway
const EVALUATE_ORDER_TIMEOUT_MS = 5000

// WebKit doesn't assign frame ids, so use 'main' as the main frame's id
const MAIN_FRAME_ID = 'main'

type RuntimeParams = {
  name?: string
  expression?: string
  contextId?: number
  returnByValue?: boolean
}

type MainFrameContext = {
  id: number
  origin: string
}

const originOf = (url: string) => {
  try {
    return new URL(url).origin
  } catch {
    return 'null'
  }
}

/**
 * Adapts a Playwright page to the `CDPSocketBridge` interface so the
 * automation socket (`CDPSocketServer`) can carry driver <-> server traffic in
 * WebKit the same way CDP does in Chromium.
 *
 * Unlike CDP, `Runtime.evaluate` resolves to the evaluated value directly —
 * not a `{ result }` envelope — and `returnByValue` is ignored since
 * Playwright always returns by value.
 *
 * Only the main frame has an execution context. A new one is reported each
 * time the main frame commits a document at a different origin, standing in
 * for CDP's per-document contexts; binding calls from child frames are dropped.
 */
export class WebKitCDPBridge extends EventEmitter implements CDPSocketBridge {
  private registeredBindings = new Set<string>()
  private nextContextId = 1
  private mainFrameContext?: MainFrameContext
  // serializes evaluations so messages reach the browser in emit order, like CDP's transport
  private evaluateChain: Promise<unknown> = Promise.resolve()

  constructor (private page: playwright.Page, private evaluateOrderTimeout: number = EVALUATE_ORDER_TIMEOUT_MS) {
    super()

    page.on('framenavigated', (frame) => {
      if (frame === this.page.mainFrame()) this.updateMainFrameContext()
    })
  }

  private updateMainFrameContext (): MainFrameContext {
    const origin = originOf(this.page.mainFrame().url())

    if (this.mainFrameContext?.origin === origin) return this.mainFrameContext

    if (this.mainFrameContext) {
      this.emitEvent('Runtime.executionContextDestroyed', { executionContextId: this.mainFrameContext.id, executionContextUniqueId: String(this.mainFrameContext.id) })
    }

    this.mainFrameContext = { id: this.nextContextId++, origin }
    this.emitContextCreated(this.mainFrameContext)

    return this.mainFrameContext
  }

  private emitContextCreated ({ id, origin }: MainFrameContext) {
    this.emitEvent('Runtime.executionContextCreated', {
      context: { id, origin, name: '', uniqueId: String(id), auxData: { frameId: MAIN_FRAME_ID, isDefault: true } },
    })
  }

  private emitEvent<E extends CDPSocketBridgeEvent> (event: E, payload: CDPSocketBridgeEventPayload<E>) {
    this.emit(event, payload)
  }

  async send (command: 'Page.enable' | 'Page.getFrameTree' | 'Runtime.enable' | 'Runtime.addBinding' | 'Runtime.evaluate', params: RuntimeParams = {}): Promise<any> {
    switch (command) {
      case 'Page.enable':
        return

      case 'Page.getFrameTree':
        return { frameTree: { frame: { id: MAIN_FRAME_ID }, childFrames: [] } }

      case 'Runtime.enable':
        // like CDP, report the context that already exists
        if (this.mainFrameContext) {
          this.emitContextCreated(this.mainFrameContext)
        } else {
          this.updateMainFrameContext()
        }

        return

      case 'Runtime.addBinding':
        // CDP treats a repeat registration as a no-op; Playwright throws
        if (this.registeredBindings.has(params.name!)) return

        this.registeredBindings.add(params.name!)

        return this.page.exposeBinding(params.name!, ({ frame }, payload: string) => {
          if (frame !== this.page.mainFrame()) {
            debugVerbose('dropping binding call from a child frame %o', { name: params.name, url: frame.url() })

            return
          }

          const executionContextId = this.updateMainFrameContext().id

          debugVerbose('binding called %o', { name: params.name, executionContextId })

          this.emitEvent('Runtime.bindingCalled', { name: params.name!, payload, executionContextId })
        })

      case 'Runtime.evaluate': {
        // like CDP, a context left behind by a navigation to another origin can't be evaluated in
        if (params.contextId !== undefined && params.contextId !== this.mainFrameContext?.id) {
          throw new Error(`Cannot find context with specified id: ${params.contextId}`)
        }

        const frame = this.page.mainFrame()

        // wrap in an IIFE so the multi-statement expression is valid for Playwright's string evaluation
        const evaluation = this.evaluateChain.then(() => frame.evaluate(`(() => {${params.expression}})()`))

        // advance the chain when the evaluation settles, or when a timeout
        // (started once the evaluation takes its turn) elapses. This way an
        // evaluation that never settles (e.g. a frame stuck mid-navigation)
        // only delays later server -> browser messages instead of stalling
        // them forever, and messages behind it stay serialized; a timed-out
        // evaluation may still complete later, trading strict ordering for
        // liveness in that degraded case
        this.evaluateChain = this.evaluateChain.then(() => {
          let timer!: NodeJS.Timeout

          return Promise.race([
            evaluation.catch(() => undefined),
            new Promise<void>((resolve) => {
              timer = setTimeout(() => {
                debug('evaluation did not settle within %dms, dispatching later messages', this.evaluateOrderTimeout)
                resolve()
              }, this.evaluateOrderTimeout)

              timer.unref?.()
            }),
          ]).finally(() => clearTimeout(timer))
        })

        return evaluation
      }

      default:
        throw new Error(`WebKitCDPBridge cannot handle command: ${command}`)
    }
  }
}
