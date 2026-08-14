import type { TapConnection } from '../tap-connection'
import type { AutFrame } from '../aut/frame'
import { FrameCommandError, withResolvedAutFrame } from '../aut/frame'
import { parseIndex, parsePositiveInt } from '../utils'
import { createFrameIsolatedWorld } from '../aut/cdp'
import { withAmbiguous } from '../aut/single-match'
import type { FrameAmbiguousResult } from '../aut/single-match'
import { readDom } from '../aut/scripts'
import type { DomReadResult } from '../aut/scripts'
import { defineNativeCommand } from './definition'

/** What `cypress tap dom` returns: the element the selector matched. */
export interface FrameDomResult {
  /** Whether the selector matched — present only in selector mode. */
  found?: boolean
  /** The matched element's outerHTML. */
  html?: string
  /** Present (always `true`) when the browser-side cap clipped the output. */
  truncated?: true
}

export const extractDom = (
  connection: TapConnection,
  frame: AutFrame,
  selector: string | undefined,
  maxChars: number,
  at?: number,
): Promise<FrameDomResult | FrameAmbiguousResult> => withAmbiguous(connection, frame, selector, at, async (): Promise<FrameDomResult> => {
  const { client, sessionId } = connection
  const executionContextId = await createFrameIsolatedWorld(connection, frame)

  const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
    functionDeclaration: readDom.toString(),
    executionContextId,
    arguments: [{ value: selector ?? null }, { value: maxChars }, { value: at ?? 0 }],
    returnByValue: true,
  }, sessionId)

  if (exceptionDetails) {
    throw new FrameCommandError('FRAME_READ_FAILED', `reading the app-under-test DOM failed: ${exceptionDetails.exception?.description || exceptionDetails.text}`)
  }

  const value = result.value as DomReadResult

  if (value.invalidSelector) {
    throw new FrameCommandError('INVALID_SELECTOR', `"${selector}" is not a valid CSS selector`)
  }

  return {
    ...(value.found !== undefined ? { found: value.found } : {}),
    ...(value.html !== undefined ? { html: value.html } : {}),
    ...(value.truncated ? { truncated: true } : {}),
  }
})

export const domCommand = defineNativeCommand('dom', (options, _args, commandOptions) => withResolvedAutFrame(options, (connection, frame) => {
  return extractDom(connection, frame, commandOptions.selector, parsePositiveInt(commandOptions['max-chars'], 'max-chars'), parseIndex(commandOptions.at))
}, 'dom'))
