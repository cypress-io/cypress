import type { Protocol } from 'devtools-protocol'
import type playwright from 'playwright-webkit'
import { NamedKeys, SupportedKey, SupportedNamedKey, toSupportedKey, isSupportedKey, SpaceKey } from '@packages/types'
import type { SendDebuggerCommand } from '../../browsers/cdp_automation'
import type { Client } from 'webdriver'
import Debug from 'debug'
import { isEqual } from 'lodash'
import { evaluateInFrameContext } from '../helpers/evaluate_in_frame_context'
import { AUT_FRAME_NAME_IDENTIFIER } from '../helpers/aut_identifier'

const debug = Debug('cypress:server:automation:command:keypress')

// This type is not exported from webdriver, but we need it to type the .map call in the bidi implementation
type InputKeySourceAction = Parameters<Client['inputPerformActions']>[0]['actions'][number] extends infer ActionParams
  ? ActionParams extends { type: 'key', actions: infer Actions }
    ? Actions extends Array<infer Action> ? Action : never
    : never
  : never

function getKeyParams (key: SupportedKey): { text?: string, key: string, code?: string } {
  if (!isSupportedKey(key)) {
    throw new Error(`Invalid key: ${key}`)
  }

  if (key === SpaceKey) {
    return {
      text: ' ',
      key: ' ',
    }
  }

  const isNamedKey = NamedKeys.includes(key)

  if (isNamedKey) {
    return {
      key,
      code: key,
    }
  }

  return {
    key,
    text: key,
  }
}

export async function cdpKeyPress (
  inKey: SupportedKey,
  send: SendDebuggerCommand,
  contexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription>,
  frameTree: Protocol.Page.FrameTree,
): Promise<void> {
  const key = toSupportedKey(inKey)

  debug('cdp keypress', { key, length: [...key].length })
  const autFrame = frameTree.childFrames?.find(({ frame }) => {
    return frame.name?.includes(AUT_FRAME_NAME_IDENTIFIER)
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
    // Named keys must be dispatched as full strings,
    // single-character keys must be dispatched as single characters,
    // multi-codepoint characters must be dispatched as individual codepoints
    const chars = NamedKeys.includes(key) ? [key] : [...key]

    for (const char of chars) {
      const params = getKeyParams(toSupportedKey(char))

      debug('dispatching keydown', params)

      await send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        ...params,
      })

      debug('dispatching keyup', params)
      await send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        ...params,
      })
    }
  } catch (e) {
    debug(e)
    throw e
  }
}

async function getActiveWindow (client: Client) {
  try {
    return await client.getWindowHandle()
  } catch (e) {
    return undefined
  }
}

// While other browsers support the named keys, BiDi does not.
// We need to override the codepoints for the named keys to work.
export const BidiOverrideCodepoints: Record<SupportedNamedKey, string> = {
  'ArrowDown': '\uE015',
  'ArrowLeft': '\uE012',
  'ArrowRight': '\uE014',
  'ArrowUp': '\uE013',
  'End': '\uE010',
  'Home': '\uE011',
  'PageDown': '\uE00F',
  'PageUp': '\uE00E',
  'Enter': '\uE007',
  'Tab': '\uE004',
  'Backspace': '\uE003',
  'Delete': '\uE017',
  'Insert': '\uE016',
  'Space': '\uE00D',
  'Escape': '\uE00C',
}

// any is fine to be used here because the key must be typeguarded before it can be used as a supported key
export async function bidiKeyPress (inKey: any, client: Client, autContext: string, idSuffix?: string): Promise<void> {
  const activeWindow = await getActiveWindow(client)
  const { contexts: [{ context: topLevelContext }] } = await client.browsingContextGetTree({})

  debug('bidi keypress', { inKey, activeWindow, topLevelContext })
  const key = toSupportedKey(BidiOverrideCodepoints[inKey] ?? inKey)

  // TODO: refactor for Cy15 https://github.com/cypress-io/cypress/issues/31480
  if (activeWindow !== topLevelContext) {
    debug('Primary window is not currently active; attempting to activate')
    try {
      await client.switchToWindow(topLevelContext)
    } catch (e) {
      debug('Error while attempting to activate main browser tab:', e)
      const err = new Error(`Unable to activate main browser tab: ${e?.message || 'Unknown Error Occurred'}. DEBUG namespace cypress:server:automation:command:keypress for more information.`)

      throw err
    }
  }

  try {
    const autFrameElement = await client.findElement('css selector', 'iframe.aut-iframe')
    const activeElement = await client.getActiveElement()

    if (!isEqual(autFrameElement, activeElement)) {
      debug('aut iframe is not currently focused; focusing aut iframe: ', autContext)
      await client.scriptEvaluate(
        {
          expression: `window.focus()`,
          target: { context: autContext },
          awaitPromise: false,
        },
      )
    }
  } catch (e) {
    debug('Error occurred during aut frame focus detection:', e)
    const err = new Error(`Unable to focus the AUT iframe: ${e?.message || 'Unknown Error Occurred'}. DEBUG namespace cypress:server:automation:command:keypress for more information.`)

    throw err
  }

  try {
    const chars = NamedKeys.includes(inKey) ? [key] : [...key]

    const actions = chars.map((value): InputKeySourceAction[] => {
      return [
        { type: 'keyDown', value },
        { type: 'keyUp', value },
      ]
    })
    .reduce((arr, el) => [...arr, ...el], [])

    debug('preparing to perform InputKeySourceActions:', { actions })

    await client.inputPerformActions({
      context: autContext,
      actions: [{
        type: 'key',
        id: `${autContext}-${inKey}-${idSuffix || Date.now()}`,
        actions,
      }],
    })

    await client.inputReleaseActions({
      context: autContext,
    })
  } catch (e) {
    debug(e)
    const err = new Error(`Unable to perform key press command for '${key}' key: ${e?.message || 'Unknown Error Occurred'}. DEBUG namespace cypress:server:automation:command:keypress for more information.`)

    throw err
  }
}

export async function webkitKeyPress (inKey: SupportedKey, page: playwright.Page): Promise<void> {
  const key = toSupportedKey(inKey)

  debug('webkit keypress', { key })

  // Locate the AUT iframe so we can ensure it has focus before dispatching the
  // key, mirroring the CDP and BiDi implementations.
  const autIframe = await page.$('iframe.aut-iframe')

  if (!autIframe) {
    throw new Error('Could not find AUT iframe')
  }

  const autFrame = await autIframe.contentFrame()

  if (!autFrame) {
    throw new Error('Could not find AUT frame')
  }

  // If the AUT iframe isn't already the active element, focus it so the key
  // press is dispatched to the application under test.
  const autFrameIsActive = await page.evaluate(() => {
    return document.activeElement?.classList.contains('aut-iframe') ?? false
  })

  if (!autFrameIsActive) {
    await autFrame.evaluate(() => window.focus())
  }

  // Named keys are dispatched as a single key. Other keys are split into their
  // individual code points so that multi-code-point characters (e.g. emoji) are
  // each dispatched in turn, matching the CDP/BiDi behavior.
  const chars = NamedKeys.includes(key) ? [key] : [...key]

  for (const char of chars) {
    // Playwright represents the Space named key as a literal space character.
    const pwKey = char === SpaceKey ? ' ' : char

    try {
      // keyboard.press dispatches full keydown/keyup events for any key present
      // in the keyboard layout (named keys and standard characters).
      await page.keyboard.press(pwKey)
    } catch (e) {
      // Characters outside WebKit's keyboard layout (e.g. '€' or combining/emoji
      // code points) cannot be dispatched as native key events. We deliberately
      // do not fall back to inserting text, as that would emit an `input` event
      // without the `keydown`/`keyup` events `cy.press()` guarantees - diverging
      // from the CDP/BiDi behavior - so surface a clear error instead.
      debug('keyboard.press failed for %o: %o', char, e)
      throw new Error(`The key '${key}' is not supported by 'cy.press()' in the experimental WebKit browser, because WebKit can only dispatch native key events for characters in its keyboard layout. DEBUG namespace cypress:server:automation:command:keypress for more information.`)
    }
  }
}
