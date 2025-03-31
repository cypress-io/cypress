import type { KeyPressParams, KeyPressSupportedKeys } from '@packages/types'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'
import type { Client } from 'webdriver'

import type { Protocol } from 'devtools-protocol'
import Debug from 'debug'

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

function executionContextForFrame (contexts: Record<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>, frame: Protocol.Page.Frame): Protocol.Runtime.ExecutionContextId | undefined {
  return Object.values(contexts).find((context) => {
    return context.auxData?.frameId === frame.id
  })?.id
}

export async function cdpKeyPress (
  { key }: KeyPressParams, send: SendDebuggerCommand,
  contexts: Record<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>,
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

  const topExecutionContext = executionContextForFrame(contexts, frameTree.frame)

  const autExecutionContext = executionContextForFrame(contexts, autFrame.frame)

  if (!topExecutionContext) {
    throw new Error('Could not find Cypress\' top execution context')
  }

  if (!autExecutionContext) {
    throw new Error('Could not find AUT execution context')
  }

  const topActiveElement = await send('Runtime.evaluate', {
    expression: 'document.activeElement',
    contextId: topExecutionContext,
  })

  if (topActiveElement.result.description && autFrame.frame.name && !topActiveElement.result.description.includes(autFrame.frame.name)) {
    await send('Runtime.evaluate', {
      expression: 'window.focus()',
      contextId: autExecutionContext,
    })
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

export async function bidiKeyPress ({ key }: KeyPressParams, client: Client, context: string, idSuffix?: string): Promise<void> {
  const value = BIDI_VALUE[key]

  if (!value) {
    throw new InvalidKeyError(key)
  }

  try {
    await client.inputPerformActions({
      context,
      actions: [{
        type: 'key',
        id: `${context}-${key}-${idSuffix || Date.now()}`,
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
