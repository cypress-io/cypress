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

// CDP accepts unicode codepoints formatted as 'U+<hex>'
export const CDP_KEYCODE: KeyCodeLookup = {
  '0': 'U+0030',
  '1': 'U+0031',
  '2': 'U+0032',
  '3': 'U+0033',
  '4': 'U+0034',
  '5': 'U+0035',
  '6': 'U+0036',
  '7': 'U+0037',
  '8': 'U+0038',
  '9': 'U+0039',
  'a': 'U+0061',
  'b': 'U+0062',
  'c': 'U+0063',
  'd': 'U+0064',
  'e': 'U+0065',
  'f': 'U+0066',
  'g': 'U+0067',
  'h': 'U+0068',
  'i': 'U+0069',
  'j': 'U+006A',
  'k': 'U+006B',
  'l': 'U+006C',
  'm': 'U+006D',
  'n': 'U+006E',
  'o': 'U+006F',
  'p': 'U+0070',
  'q': 'U+0071',
  'r': 'U+0072',
  's': 'U+0073',
  't': 'U+0074',
  'u': 'U+0075',
  'v': 'U+0076',
  'w': 'U+0077',
  'x': 'U+0078',
  'y': 'U+0079',
  'z': 'U+007A',
  'A': 'U+0041',
  'B': 'U+0042',
  'C': 'U+0043',
  'D': 'U+0044',
  'E': 'U+0045',
  'F': 'U+0046',
  'G': 'U+0047',
  'H': 'U+0048',
  'I': 'U+0049',
  'J': 'U+004A',
  'K': 'U+004B',
  'L': 'U+004C',
  'M': 'U+004D',
  'N': 'U+004E',
  'O': 'U+004F',
  'P': 'U+0050',
  'Q': 'U+0051',
  'R': 'U+0052',
  'S': 'U+0053',
  'T': 'U+0054',
  'U': 'U+0055',
  'V': 'U+0056',
  'W': 'U+0057',
  'X': 'U+0058',
  'Y': 'U+0059',
  'Z': 'U+005A',
  '!': 'U+0021',
  '@': 'U+0040',
  '#': 'U+0023',
  '$': 'U+0024',
  '%': 'U+0025',
  '^': 'U+005E',
  '&': 'U+0026',
  '*': 'U+002A',
  '(': 'U+0028',
  ')': 'U+0029',
  '-': 'U+002D',
  '_': 'U+005F',
  '=': 'U+003D',
  '+': 'U+002B',
  '[': 'U+005B',
  ']': 'U+005D',
  '{': 'U+007B',
  '}': 'U+007D',
  '\\': 'U+005C',
  '|': 'U+007C',
  ';': 'U+003B',
  ':': 'U+003A',
  '\'': 'U+0027',
  '"': 'U+0022',
  ',': 'U+002C',
  '<': 'U+003C',
  '.': 'U+002E',
  '>': 'U+003E',
  '/': 'U+002F',
  '?': 'U+003F',
  '`': 'U+0060',
  '~': 'U+007E',
  ' ': 'U+0020',
  'Enter': 'U+000D',
  'Tab': 'U+0009',
  'Backspace': 'U+0008',
  'Delete': 'U+007F',
  'Insert': 'U+001B',
  'Home': 'U+001C',
  'End': 'U+001D',
  'PageUp': 'U+001E',
  'PageDown': 'U+001F',
  'ArrowUp': 'U+0010',
  'ArrowDown': 'U+0011',
  'ArrowLeft': 'U+0012',
  'ArrowRight': 'U+0013',
  'F1': 'U+0070',
  'F2': 'U+0071',
  'F3': 'U+0072',
  'F4': 'U+0073',
  'F5': 'U+0074',
  'F6': 'U+0075',
  'F7': 'U+0076',
  'F8': 'U+0077',
  'F9': 'U+0078',
  'F10': 'U+0079',
  'F11': 'U+007A',
  'F12': 'U+007B',
  'Escape': 'U+001B',
  'CapsLock': 'U+0014',
  'NumLock': 'U+0090',
  'ScrollLock': 'U+0091',
  'Pause': 'U+0013',
  'AudioVolumeMute': 'U+00AD',
  'AudioVolumeDown': 'U+00AE',
  'AudioVolumeUp': 'U+00AF',
  'MediaTrackNext': 'U+00B0',
  'MediaTrackPrevious': 'U+00B1',
  'MediaStop': 'U+00B2',
  'MediaPlayPause': 'U+00B3',
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

// See: https://www.w3.org/TR/webdriver/#keyboard-actions
// BIDI accepts unicode codepoints formatted as '\u<hex>', with some exceptions
export const BIDI_VALUE: KeyCodeLookup = {
  '0': '\u0030',
  '1': '\u0031',
  '2': '\u0032',
  '3': '\u0033',
  '4': '\u0034',
  '5': '\u0035',
  '6': '\u0036',
  '7': '\u0037',
  '8': '\u0038',
  '9': '\u0039',
  'a': '\u0061',
  'b': '\u0062',
  'c': '\u0063',
  'd': '\u0064',
  'e': '\u0065',
  'f': '\u0066',
  'g': '\u0067',
  'h': '\u0068',
  'i': '\u0069',
  'j': '\u006A',
  'k': '\u006B',
  'l': '\u006C',
  'm': '\u006D',
  'n': '\u006E',
  'o': '\u006F',
  'p': '\u0070',
  'q': '\u0071',
  'r': '\u0072',
  's': '\u0073',
  't': '\u0074',
  'u': '\u0075',
  'v': '\u0076',
  'w': '\u0077',
  'x': '\u0078',
  'y': '\u0079',
  'z': '\u007A',
  'A': '\u0041',
  'B': '\u0042',
  'C': '\u0043',
  'D': '\u0044',
  'E': '\u0045',
  'F': '\u0046',
  'G': '\u0047',
  'H': '\u0048',
  'I': '\u0049',
  'J': '\u004A',
  'K': '\u004B',
  'L': '\u004C',
  'M': '\u004D',
  'N': '\u004E',
  'O': '\u004F',
  'P': '\u0050',
  'Q': '\u0051',
  'R': '\u0052',
  'S': '\u0053',
  'T': '\u0054',
  'U': '\u0055',
  'V': '\u0056',
  'W': '\u0057',
  'X': '\u0058',
  'Y': '\u0059',
  'Z': '\u005A',
  '!': '\u0021',
  '@': '\u0040',
  '#': '\u0023',
  '$': '\u0024',
  '%': '\u0025',
  '^': '\u005E',
  '&': '\u0026',
  '*': '\u002A',
  '(': '\u0028',
  ')': '\u0029',
  '-': '\u002D',
  '_': '\u005F',
  '=': '\u003D',
  '+': '\u002B',
  '[': '\u005B',
  ']': '\u005D',
  '{': '\u007B',
  '}': '\u007D',
  '\\': '\u005C',
  '|': '\u007C',
  ';': '\u003B',
  ':': '\u003A',
  '\'': '\u0027',
  '"': '\u0022',
  ',': '\u002C',
  '<': '\u003C',
  '.': '\u002E',
  '>': '\u003E',
  '/': '\u002F',
  '?': '\u003F',
  '`': '\u0060',
  '~': '\u007E',
  ' ': '\u0020',
  'Enter': '\uE007',
  'Tab': '\uE004',
  'Backspace': '\uE003',
  'Delete': '\uE017',
  'Insert': '\uE016',
  'Home': '\uE011',
  'End': '\uE010',
  'PageUp': '\uE00E',
  'PageDown': '\uE00F',
  'ArrowUp': '\uE013',
  'ArrowDown': '\uE015',
  'ArrowLeft': '\uE012',
  'ArrowRight': '\uE014',
  'F1': '\uE031',
  'F2': '\uE032',
  'F3': '\uE033',
  'F4': '\uE034',
  'F5': '\uE035',
  'F6': '\uE036',
  'F7': '\uE037',
  'F8': '\uE038',
  'F9': '\uE039',
  'F10': '\uE03A',
  'F11': '\uE03B',
  'F12': '\uE03C',
  'Escape': '\uE00C',
  'CapsLock': '\uE008',
  'NumLock': '\uE01F',
  'ScrollLock': '\uE01E',
  'Pause': '\uE00B',
  'AudioVolumeMute': '\uE02D',
  'AudioVolumeDown': '\uE02E',
  'AudioVolumeUp': '\uE02F',
  'MediaTrackNext': '\uE030',
  'MediaTrackPrevious': '\uE02C',
  'MediaStop': '\uE02B',
  'MediaPlayPause': '\uE0B3',
}

async function getActiveWindow (client: Client) {
  try {
    return await client.getWindowHandle()
  } catch (e) {
    return undefined
  }
}

export async function bidiKeyPress ({ key }: KeyPressParams, client: Client, autContext: string, idSuffix?: string): Promise<void> {
  const value = BIDI_VALUE[key]

  if (!value) {
    throw new InvalidKeyError(key)
  }

  const activeWindow = await getActiveWindow(client)
  const { contexts: [{ context: topLevelContext }] } = await client.browsingContextGetTree({})

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
    const err = new Error(`Unable to perform key press command for '${key}' key: ${e?.message || 'Unknown Error Occurred'}. DEBUG namespace cypress:server:automation:command:keypress for more information.`)

    throw err
  }
}
