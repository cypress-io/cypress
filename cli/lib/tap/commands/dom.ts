import type { TapConnection } from '../tap-connection'
import type { AutFrame } from '../aut/frame'
import { invalidSelectorError, withResolvedAutFrame } from '../aut/frame'
import { TapError } from '@packages/cypress-sessions'
import { parseIndex, parsePositiveInt } from '../utils'
import { createFrameIsolatedWorld } from '../aut/cdp'
import { withAmbiguous } from '../aut/single-match'
import type { FrameAmbiguousResult } from '../aut/single-match'
import { readDom } from '../aut/scripts'
import type { DomReadResult } from '../aut/scripts'
import { defineNativeCommand } from './definition'

/** What `cypress tap dom` returns: the element the selector matched. */
export interface FrameDomResult {
  /** Whether the selector matched. */
  found?: boolean
  /** The matched element's outerHTML. */
  html?: string
  /** Present (always `true`) when the browser-side cap clipped the output. */
  truncated?: true
}

export const extractDom = (
  connection: TapConnection,
  frame: AutFrame,
  selector: string,
  maxChars: number,
  at?: number,
): Promise<FrameDomResult | FrameAmbiguousResult> => withAmbiguous(connection, frame, selector, at, async (): Promise<FrameDomResult> => {
  const { client, sessionId } = connection
  const executionContextId = await createFrameIsolatedWorld(connection, frame)

  const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
    functionDeclaration: readDom.toString(),
    executionContextId,
    arguments: [{ value: selector }, { value: maxChars }, { value: at ?? 0 }],
    returnByValue: true,
  }, sessionId)

  if (exceptionDetails) {
    throw new TapError('FRAME_READ_FAILED', { message: `reading the app-under-test DOM failed: ${exceptionDetails.exception?.description || exceptionDetails.text}` })
  }

  const value = result.value as DomReadResult

  // Only a selector the reader was given can come back rejected.
  if (value.invalidSelector) {
    throw invalidSelectorError(selector!)
  }

  return {
    ...(value.found !== undefined ? { found: value.found } : {}),
    ...(value.html !== undefined ? { html: value.html } : {}),
    ...(value.truncated ? { truncated: true } : {}),
  }
})

// The options are read before a session is resolved, so a value this command
// cannot use is reported as itself rather than as whatever the search for a
// Cypress to run it against happened to find.
export const domCommand = defineNativeCommand('dom', (options, _args, commandOptions) => {
  const maxChars = parsePositiveInt(commandOptions['max-chars'], 'max-chars')
  const at = parseIndex(commandOptions.at)

  return withResolvedAutFrame(options, (connection, frame) => {
    return extractDom(connection, frame, commandOptions.selector, maxChars, at)
  }, 'dom')
})
