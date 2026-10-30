import { evaluateInFrameContext } from '../helpers/evaluate_in_frame_context'
import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../browsers/cdp-protocol/cdp_automation'
import type { Client as WebDriverClient } from 'webdriver'
import type playwright from 'playwright-webkit'

const expressionToEvaluate = (historyNumber: number) => `window.history.go(${historyNumber})`

export async function cdpNavigateHistory (send: SendDebuggerCommand, contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>, frame: Protocol.Page.Frame, historyNumber: number): Promise<void> {
  await evaluateInFrameContext(expressionToEvaluate(historyNumber), send, contexts, frame)
}

export async function webkitNavigateHistory (frame: playwright.Frame, historyNumber: number): Promise<void> {
  await frame.evaluate(expressionToEvaluate(historyNumber))
}

export async function bidiNavigateHistory (webDriverClient: WebDriverClient, autContextId: string, historyNumber: number): Promise<void> {
  await webDriverClient.scriptEvaluate({
    expression: expressionToEvaluate(historyNumber),
    target: {
      context: autContextId,
    },
    awaitPromise: false,
  })
}
