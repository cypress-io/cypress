import type { TapSession } from '../tap-session'
import type { AutFrame } from '../aut/frame'
import { FrameCommandError, parsePositiveInt, withResolvedAutFrame } from '../aut/frame'
import { createFrameIsolatedWorld } from '../aut/cdp'
import { readDom } from '../aut/scripts'
import type { DomReadResult } from '../aut/scripts'
import { defineNativeCommand } from './definition'

const DEFAULT_MAX_CHARS = 30000

interface FrameDomResult {
  url?: string
  html?: string
  matches?: { count: number, html: string[] }
  truncated?: true
}

export const extractDom = async (
  session: TapSession,
  frame: AutFrame,
  selector: string | undefined,
  maxChars: number,
): Promise<FrameDomResult> => {
  const { client, sessionId } = session
  const executionContextId = await createFrameIsolatedWorld(session, frame)

  const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
    functionDeclaration: readDom.toString(),
    executionContextId,
    arguments: [{ value: selector ?? null }, { value: maxChars }],
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
    ...(frame.url ? { url: frame.url } : {}),
    ...(value.matches ? { matches: value.matches } : {}),
    ...(value.html !== undefined ? { html: value.html } : {}),
    ...(value.truncated ? { truncated: true } : {}),
  }
}

export const domCommand = defineNativeCommand('dom', (options, args, commandOptions) => withResolvedAutFrame(options, (session, frame) => {
  return extractDom(session, frame, args.selector, parsePositiveInt(commandOptions['max-chars'], DEFAULT_MAX_CHARS, 'max-chars'))
}, 'dom'))
