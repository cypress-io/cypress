import type { TapSession } from '../tap-session'
import type { AutFrame } from '../aut/frame'
import { FrameCommandError, parseIndex, parsePositiveInt, withResolvedAutFrame } from '../aut/frame'
import { createFrameIsolatedWorld } from '../aut/cdp'
import { resolveMatch } from '../aut/single-match'
import type { FrameAmbiguousResult } from '../aut/single-match'
import { readDom } from '../aut/scripts'
import type { DomReadResult } from '../aut/scripts'
import { defineNativeCommand } from './definition'

const DEFAULT_MAX_CHARS = 30000

/** What `cypress tap dom` returns: the whole document, or the matched element. */
export interface FrameDomResult {
  /** Whether the selector matched — present only in selector mode. */
  found?: boolean
  /** The matched element's outerHTML, or the whole document in whole-page mode. */
  html?: string
  /** Present (always `true`) when the browser-side cap clipped the output. */
  truncated?: true
}

export const extractDom = async (
  session: TapSession,
  frame: AutFrame,
  selector: string | undefined,
  maxChars: number,
  at?: number,
): Promise<FrameDomResult | FrameAmbiguousResult> => {
  const { client, sessionId } = session
  const ambiguous = await resolveMatch(session, frame, selector, at)

  if (ambiguous) {
    return ambiguous
  }

  const executionContextId = await createFrameIsolatedWorld(session, frame)

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
}

export const domCommand = defineNativeCommand('dom', (options, _args, commandOptions) => withResolvedAutFrame(options, (session, frame) => {
  return extractDom(session, frame, commandOptions.selector, parsePositiveInt(commandOptions['max-chars'], DEFAULT_MAX_CHARS, 'max-chars'), parseIndex(commandOptions.at))
}, 'dom'))
