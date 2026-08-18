import { evaluateInFrameContext } from '../helpers/evaluate_in_frame_context'
import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../browsers/cdp-protocol/cdp_automation'
import type { Client as WebDriverClient } from 'webdriver'
import type { NavigateHistoryResult } from '@packages/types'

const expressionToEvaluate = (historyNumber: number) => `window.history.go(${historyNumber})`

// Session history is shared by every frame in the tab, so `history.go()` called
// from the AUT can traverse an entry that belongs to Cypress rather than to the
// application - the top-level navigation `cy.visit()` performs when the origin
// under test changes creates one of those entries. Traversing it unloads the
// Cypress runner mid-spec, which restarts or hangs the run.
// Entries created by AUT navigations carry the runner's url, since the url of a
// history entry is always the url of the top-level document, so an entry whose
// url differs from the current one is the runner's own.
const isRunnerHistoryEntry = ({ currentIndex, entries }: Protocol.Page.GetNavigationHistoryResponse, historyNumber: number): boolean => {
  const target = entries[currentIndex + historyNumber]

  // out of range: the browser has nothing to traverse to and `history.go()` is a
  // no-op, which is the behavior callers already expect
  if (!target) {
    return false
  }

  return target.url !== entries[currentIndex].url
}

export async function cdpNavigateHistory (send: SendDebuggerCommand, contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>, frame: Protocol.Page.Frame, historyNumber: number): Promise<NavigateHistoryResult> {
  const history = await send('Page.getNavigationHistory')

  if (isRunnerHistoryEntry(history, historyNumber)) {
    return { traversed: false }
  }

  await evaluateInFrameContext(expressionToEvaluate(historyNumber), send, contexts, frame)

  return { traversed: true }
}

// WebDriver BiDi has no equivalent of `Page.getNavigationHistory`, so the entry
// about to be traversed cannot be inspected and the runner cannot be protected
// the way it is over CDP.
export async function bidiNavigateHistory (webDriverClient: WebDriverClient, autContextId: string, historyNumber: number): Promise<NavigateHistoryResult> {
  await webDriverClient.scriptEvaluate({
    expression: expressionToEvaluate(historyNumber),
    target: {
      context: autContextId,
    },
    awaitPromise: false,
  })

  return { traversed: true }
}
