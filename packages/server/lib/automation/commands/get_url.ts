import { evaluateInFrameContext } from '../helpers/evaluate_in_frame_context'
import type { Protocol } from 'devtools-protocol'
import type { Client as WebDriverClient } from 'webdriver'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'

export async function cdpGetUrl (send: SendDebuggerCommand, contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>, frame: Protocol.Page.Frame): Promise<string> {
  return (await evaluateInFrameContext(`window.location.href`, send, contexts, frame!))?.result?.value
}

export async function bidiGetUrl (webDriverClient: WebDriverClient, autContextId: string): Promise<string> {
  const { contexts: autContext } = await webDriverClient.browsingContextGetTree({
    root: autContextId,
  })

  return autContext ? autContext[0].url : ''
}
