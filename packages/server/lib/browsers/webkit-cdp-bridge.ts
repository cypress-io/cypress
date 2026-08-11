import { EventEmitter } from 'events'
import Debug from 'debug'
import type playwright from 'playwright-webkit'
import type { CDPSocketBridge } from '@packages/socket'

const debugVerbose = Debug('cypress-verbose:server:browsers:webkit-cdp-bridge')

/**
 * Adapts a Playwright page to the `CDPSocketBridge` interface so the
 * automation socket (`CDPSocketServer`) can carry driver <-> server traffic in
 * WebKit the same way CDP does in Chromium.
 *
 * Unlike CDP, `Runtime.evaluate` resolves to the evaluated value directly —
 * not a `{ result }` envelope — and `returnByValue` is ignored since
 * Playwright always returns by value.
 */
export class WebKitCDPBridge extends EventEmitter implements CDPSocketBridge {
  private frameByContextId = new Map<number, playwright.Frame>()
  private contextIdByFrame = new WeakMap<playwright.Frame, number>()
  private registeredBindings = new Set<string>()
  private nextContextId = 1
  // serializes evaluations so messages reach the browser in emit order, like CDP's transport
  private evaluateChain: Promise<unknown> = Promise.resolve()

  constructor (private page: playwright.Page) {
    super()

    page.on('framedetached', (frame) => {
      const contextId = this.contextIdByFrame.get(frame)

      if (contextId !== undefined) this.frameByContextId.delete(contextId)
    })
  }

  async send (command: 'Runtime.enable' | 'Runtime.addBinding' | 'Runtime.evaluate', params?: any): Promise<any> {
    switch (command) {
      case 'Runtime.enable':
        return

      case 'Runtime.addBinding':
        // CDP treats a repeat registration as a no-op; Playwright throws
        if (this.registeredBindings.has(params.name)) return

        this.registeredBindings.add(params.name)

        return this.page.exposeBinding(params.name, ({ frame }, payload: string) => {
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
        const frame = (params.contextId && this.frameByContextId.get(params.contextId)) || this.page.mainFrame()

        // wrap in an IIFE so the multi-statement expression is valid for Playwright's string evaluation
        const evaluation = this.evaluateChain.then(() => frame.evaluate(`(() => {${params.expression}})()`))

        this.evaluateChain = evaluation.catch(() => undefined)

        return evaluation
      }

      default:
        throw new Error(`WebKitCDPBridge cannot handle command: ${command}`)
    }
  }
}
