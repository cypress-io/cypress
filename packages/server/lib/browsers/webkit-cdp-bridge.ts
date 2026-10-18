import { EventEmitter } from 'events'
import Debug from 'debug'
import type playwright from 'playwright-webkit'
import type { CDPSocketBridge } from '@packages/socket'

const debug = Debug('cypress:server:browsers:webkit-cdp-bridge')
const debugVerbose = Debug('cypress-verbose:server:browsers:webkit-cdp-bridge')

// how long a single evaluation may hold up the ordering chain before later
// messages are dispatched anyway
const EVALUATE_ORDER_TIMEOUT_MS = 5000

type RuntimeParams = {
  name?: string
  expression?: string
  contextId?: number
  returnByValue?: boolean
  functionDeclaration?: string
  arguments?: Array<{ value?: unknown }>
  executionContextId?: number
  objectId?: string
}

type PageFunction = (args: unknown[]) => unknown

/**
 * Adapts a Playwright page to the `CDPSocketBridge` interface so the
 * automation socket (`CDPSocketServer`) can carry driver <-> server traffic in
 * WebKit the same way CDP does in Chromium.
 *
 * Unlike CDP, `Runtime.evaluate` and `Runtime.callFunctionOn` resolve to the
 * value directly — not a `{ result }` envelope — and `returnByValue` is
 * ignored since Playwright always returns by value. The bridge models no
 * remote objects, so `Runtime.callFunctionOn` ignores `objectId` and, like
 * `Runtime.evaluate`, runs in the main frame unless given a known context.
 */
export class WebKitCDPBridge extends EventEmitter implements CDPSocketBridge {
  private frameByContextId = new Map<number, playwright.Frame>()
  private contextIdByFrame = new WeakMap<playwright.Frame, number>()
  private registeredBindings = new Set<string>()
  private nextContextId = 1
  // serializes evaluations so messages reach the browser in emit order, like CDP's transport
  private evaluateChain: Promise<unknown> = Promise.resolve()
  private pageFunctions = new Map<string, PageFunction>()

  constructor (private page: playwright.Page, private evaluateOrderTimeout: number = EVALUATE_ORDER_TIMEOUT_MS) {
    super()

    page.on('framedetached', (frame) => {
      const contextId = this.contextIdByFrame.get(frame)

      if (contextId !== undefined) this.frameByContextId.delete(contextId)
    })
  }

  async send (command: 'Runtime.enable' | 'Runtime.addBinding' | 'Runtime.evaluate' | 'Runtime.callFunctionOn', params: RuntimeParams = {}): Promise<any> {
    switch (command) {
      case 'Runtime.enable':
        return

      case 'Runtime.addBinding':
        // CDP treats a repeat registration as a no-op; Playwright throws
        if (this.registeredBindings.has(params.name!)) return

        this.registeredBindings.add(params.name!)

        return this.page.exposeBinding(params.name!, ({ frame }, payload: string) => {
          let executionContextId = this.contextIdByFrame.get(frame)

          if (executionContextId === undefined) {
            executionContextId = this.nextContextId++
            this.contextIdByFrame.set(frame, executionContextId)
            this.frameByContextId.set(executionContextId, frame)
          }

          debugVerbose('binding called %o', { name: params.name, executionContextId })

          this.emit('Runtime.bindingCalled', { name: params.name, payload, executionContextId })
        })

      case 'Runtime.evaluate': {
        const frame = this.frameFor(params.contextId)

        // wrap in an IIFE so the multi-statement expression is valid for Playwright's string evaluation
        return this.enqueue(() => frame.evaluate(`(() => {${params.expression}})()`))
      }

      case 'Runtime.callFunctionOn': {
        const frame = this.frameFor(params.executionContextId)
        const pageFunction = this.pageFunctionFor(params.functionDeclaration!)
        const args = (params.arguments ?? []).map((arg) => arg.value)

        // the arguments travel as Playwright's serialized evaluate argument, not as script source
        return this.enqueue(() => frame.evaluate(pageFunction, args))
      }

      default:
        throw new Error(`WebKitCDPBridge cannot handle command: ${command}`)
    }
  }

  private frameFor (contextId?: number): playwright.Frame {
    return (contextId && this.frameByContextId.get(contextId)) || this.page.mainFrame()
  }

  // Playwright only calls a page function it is given as a function; a string
  // is evaluated as an expression and never receives the argument. Build one
  // from the declaration (once per declaration) that Playwright serializes
  // back to source and calls with the argument values spread like CDP's.
  private pageFunctionFor (functionDeclaration: string): PageFunction {
    let pageFunction = this.pageFunctions.get(functionDeclaration)

    if (!pageFunction) {
      pageFunction = new Function(`return (args) => (${functionDeclaration}).apply(globalThis, args)`)() as PageFunction
      this.pageFunctions.set(functionDeclaration, pageFunction)
    }

    return pageFunction
  }

  private enqueue<T> (run: () => Promise<T>): Promise<T> {
    const evaluation = this.evaluateChain.then(run)

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
}
