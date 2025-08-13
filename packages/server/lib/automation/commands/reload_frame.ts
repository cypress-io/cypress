import { evaluateInFrameContext } from '../helpers/evaluate_in_frame_context'
import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'
import type { Client as WebDriverClient } from 'webdriver'

const expressionToEvaluate = (forceReload = false) => `window.location.reload(${forceReload})`

export async function cdpReloadFrame (send: SendDebuggerCommand, contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>, frame: Protocol.Page.Frame, forceReload: boolean): Promise<void> {
  await evaluateInFrameContext(expressionToEvaluate(forceReload), send, contexts, frame)
}

export async function bidiReloadFrame (webDriverClient: WebDriverClient, autContextId: string, forceReload: boolean): Promise<void> {
  await webDriverClient.scriptEvaluate({
    expression: expressionToEvaluate(forceReload),
    target: {
      context: autContextId,
    },
    awaitPromise: false,
  })
}
