import type { TapSession } from '../tap-session'
import type { AutFrame } from '../aut/frame'
import { FrameCommandError, parsePositiveInt, withResolvedAutFrame } from '../aut/frame'
import { createFrameIsolatedWorld } from '../aut/cdp'
import { readDom } from '../aut/scripts'
import type { DomReadResult } from '../aut/scripts'
import type { TapCliCommand } from '../types'

const DEFAULT_MAX_CHARS = 30000

const DOM_DETAILS = `Reads the app-under-test DOM as HTML: the whole page, or the outerHTML of
each element matching a CSS selector (each match includes its full subtree).
Output is capped browser-side so a heavy page never ships megabytes at once.`

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

export const domCommand: TapCliCommand = {
  name: 'dom',
  description: 'read the app-under-test DOM as HTML: the whole page, or each element matching a selector (with its subtree)',
  details: DOM_DETAILS,
  params: [{ name: 'selector', type: 'string', required: false, description: 'a CSS selector; omit to read the whole document' }],
  options: [{ name: 'max-chars', type: 'string', required: false, description: 'cap on returned HTML characters (default 30000)' }],
  handler: (options, args, commandOptions) => withResolvedAutFrame(options, (session, frame) => {
    return extractDom(session, frame, args.selector, parsePositiveInt(commandOptions['max-chars'], DEFAULT_MAX_CHARS, 'max-chars'))
  }),
}
