import { evaluateInFrameContext } from '../helpers/evaluate_in_frame_context'
import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'
import type { Client as WebDriverClient } from 'webdriver'

const expressionToEvaluate = `window.document.title`

export async function cdpGetFrameTitle (send: SendDebuggerCommand, contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>, frame: Protocol.Page.Frame): Promise<string> {
  return (await evaluateInFrameContext(expressionToEvaluate, send, contexts, frame!))?.result?.value
}

export async function bidiGetFrameTitle (webDriverClient: WebDriverClient, autContextId: string): Promise<string> {
  return (await webDriverClient.scriptEvaluate({
    expression: expressionToEvaluate,
    target: {
      context: autContextId,
    },
    awaitPromise: false,
    // @ts-expect-error - result is not typed
  }))?.result?.value
}
