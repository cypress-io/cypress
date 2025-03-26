import type { KeyPressParams, KeyPressSupportedKeys } from '@packages/types'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'
import type { Client } from 'webdriver'

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

export const CDP_KEYCODE: KeyCodeLookup = {
  'Tab': 'U+000009',
}

export async function cdpKeyPress ({ key }: KeyPressParams, send: SendDebuggerCommand): Promise<void> {
  debug('cdp keypress', { key })
  if (!CDP_KEYCODE[key]) {
    throw new InvalidKeyError(key)
  }

  const keyIdentifier = CDP_KEYCODE[key]

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
