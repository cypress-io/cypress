import type { Protocol } from 'devtools-protocol'
import type { Client } from 'webdriver'
import Debug from 'debug'
import type { SendDebuggerCommand } from '../../browsers/cdp-protocol/cdp_automation'

const debug = Debug('cypress:server:automation:command:user_activation')

// The isolated world keeps the evaluation out of the page's own JavaScript realm, so the
// application has no script, global or event to observe.
const USER_ACTIVATION_WORLD_NAME = '__cypress_user_activation__'

// Gives the AUT document the user activation a real user's click or key press gives it:
// sticky activation, which lasts as long as the document (`navigator.userActivation.hasBeenActive`
// becomes `true`) and lets APIs like `navigator.vibrate()` and `beforeunload` prompts work,
// and transient activation, which lasts a few seconds (`navigator.userActivation.isActive`)
// and lets APIs like `requestFullscreen()` and `showPicker()` work.
//
// Rather than dispatching trusted input, which would reach the application's
// `pointerdown`/`keydown` listeners and could move focus, this evaluates a no-op with the
// `userGesture` flag. Chromium notifies activation for the frame the script runs in, its
// ancestors and its same-origin descendants, exactly as it would for a real gesture.
//
// Action commands activate the page again for every command, so the world made for a
// document is kept and used again until that document goes away.
export async function cdpActivateFrame (
  send: SendDebuggerCommand,
  contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>,
  frame: Protocol.Page.Frame,
): Promise<void> {
  debug('activating frame %s', frame.id)

  const existing = [...contexts.values()].find((context) => {
    return context.name === USER_ACTIVATION_WORLD_NAME && context.auxData?.frameId === frame.id
  })

  if (existing) {
    try {
      return await evaluateWithUserGesture(send, existing.id)
    } catch (err) {
      if (!err?.message?.includes('Cannot find context with specified id')) {
        throw err
      }

      debug('isolated world %d is gone, creating another', existing.id)
      contexts.delete(existing.id)
    }
  }

  const { executionContextId } = await send('Page.createIsolatedWorld', {
    frameId: frame.id,
    worldName: USER_ACTIVATION_WORLD_NAME,
  })

  await evaluateWithUserGesture(send, executionContextId)
}

async function evaluateWithUserGesture (send: SendDebuggerCommand, contextId: Protocol.Runtime.ExecutionContextId) {
  const { exceptionDetails } = await send('Runtime.evaluate', {
    expression: 'void 0',
    contextId,
    userGesture: true,
  })

  if (exceptionDetails) {
    throw new Error(`Unable to activate the AUT frame: ${exceptionDetails.text}`)
  }
}

// The WebDriver BiDi equivalent of `cdpActivateFrame`: `userActivation: true` evaluates the
// script as if it ran in response to a user gesture, in a sandbox the page can't observe.
export async function bidiActivateContext (client: Client, context: string): Promise<void> {
  debug('activating context %s', context)

  const result = await client.scriptEvaluate({
    expression: 'void 0',
    target: { context, sandbox: USER_ACTIVATION_WORLD_NAME },
    awaitPromise: false,
    userActivation: true,
  })

  if (result.type === 'exception') {
    throw new Error(`Unable to activate the AUT frame: ${result.exceptionDetails.text}`)
  }
}
