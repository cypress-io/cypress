import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import type { Protocol } from 'devtools-protocol'
import type { KeyPressParams, KeyPressSupportedKeys } from '@packages/types'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'
import type { Client } from 'webdriver'
import Debug from 'debug'
import { isEqual, isError } from 'lodash'

const debug = Debug('cypress:server:automation:command:keypress')

interface KeyCodeLookup extends Record<KeyPressSupportedKeys, string> {}

const invalidKeyErrorKind = 'InvalidKeyError'

export class InvalidKeyError extends Error {
  kind = invalidKeyErrorKind
  constructor (key: string) {
    super(`${key} is not supported by 'cy.press()'.`)
  }
  static isInvalidKeyError (e: any): e is InvalidKeyError {
    return e.kind === invalidKeyErrorKind
  }
}

export function isSupportedKey (key: string): key is KeyPressSupportedKeys {
  return CDP_KEYCODE[key] && BIDI_VALUE[key]
}

export const CDP_KEYCODE: KeyCodeLookup = {
  'Tab': 'U+000009',
}

async function evaluateInFrameContext (expression: string,
  send: SendDebuggerCommand,
  contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>,
  frame: Protocol.Page.Frame): Promise<ProtocolMapping.Commands['Runtime.evaluate']['returnType']> {
  for (const [contextId, context] of contexts.entries()) {
    if (context.auxData?.frameId === frame.id) {
      try {
        return await send('Runtime.evaluate', {
          expression,
          contextId,
        })
      } catch (e) {
        if (isError(e) && (e as Error).message.includes('Cannot find context with specified id')) {
          debug('found invalid context %d, removing', contextId)
          contexts.delete(contextId)
        }
      }
    }
  }
  throw new Error('Unable to find valid context for frame')
}

export async function cdpKeyPress (
  { key }: KeyPressParams, send: SendDebuggerCommand,
  contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>,
  frameTree: Protocol.Page.FrameTree,
): Promise<void> {
  debug('cdp keypress', { key })
  if (!CDP_KEYCODE[key]) {
    throw new InvalidKeyError(key)
  }

  const keyIdentifier = CDP_KEYCODE[key]

  const autFrame = frameTree.childFrames?.find(({ frame }) => {
    return frame.name?.includes('Your project')
  })

  if (!autFrame) {
    throw new Error('Could not find AUT frame')
  }

  const topActiveElement = await evaluateInFrameContext('document.activeElement', send, contexts, frameTree.frame)

  const autFrameIsActive = topActiveElement.result.description && autFrame.frame.name && topActiveElement.result.description.includes(autFrame.frame.name)

  if (!autFrameIsActive) {
    await evaluateInFrameContext('window.focus()', send, contexts, autFrame.frame)
  }

  try {
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code: key,
      keyIdentifier,
    })

    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: key,
      keyIdentifier,
    })
  } catch (e) {
    debug(e)
    throw e
  }
}

export const BIDI_VALUE: KeyCodeLookup = {
  'Tab': '\uE004',
}

export async function bidiKeyPress ({ key }: KeyPressParams, client: Client, autContext: string, idSuffix?: string): Promise<void> {
  const value = BIDI_VALUE[key]

  if (!value) {
    throw new InvalidKeyError(key)
  }

  const autFrameElement = await client.findElement('css selector', 'iframe.aut-iframe')
  const activeElement = await client.getActiveElement()

  if (!isEqual(autFrameElement, activeElement)) {
    await client.scriptEvaluate(
      {
        expression: `window.focus()`,
        target: { context: autContext },
        awaitPromise: false,
      },
    )
  }

  try {
    await client.inputPerformActions({
      context: autContext,
      actions: [{
        type: 'key',
        id: `${autContext}-${key}-${idSuffix || Date.now()}`,
        actions: [
          { type: 'keyDown', value },
          { type: 'keyUp', value },
        ],
      }],
    })
  } catch (e) {
    debug(e)
    throw e
  }
}
