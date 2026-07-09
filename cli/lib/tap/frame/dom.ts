import type { TapSession } from '../tap-session'
import type { AutFrame } from '../aut-frame'
import { FrameCommandError } from '../aut-frame'

export const DEFAULT_MAX_CHARS = 30000

// Runs in an isolated world in the AUT frame (shares the DOM, separate JS
// context — no page-global pollution). Caps output browser-side so a heavy
// page never ships megabytes across CDP. Returns a tagged object rather than
// throwing, so a bad selector round-trips as data instead of a CDP exception.
const DOM_FN = `function (selector, maxChars) {
  if (selector === null) {
    var html = document.documentElement ? document.documentElement.outerHTML : ''
    return html.length > maxChars ? { html: html.slice(0, maxChars), truncated: true } : { html: html }
  }
  var els
  try { els = Array.prototype.slice.call(document.querySelectorAll(selector)) }
  catch (e) { return { invalidSelector: true } }
  var out = [], remaining = maxChars, truncated = false
  for (var i = 0; i < els.length; i++) {
    var o = els[i].outerHTML
    if (o.length > remaining) { if (remaining > 0) out.push(o.slice(0, remaining)); truncated = true; break }
    out.push(o); remaining -= o.length
  }
  return { matches: { count: els.length, html: out }, truncated: truncated }
}`

export interface FrameDomResult {
  url?: string
  html?: string
  matches?: { count: number, html: string[] }
  truncated?: true
}

interface DomFnResult {
  html?: string
  matches?: { count: number, html: string[] }
  truncated?: boolean
  invalidSelector?: boolean
}

export const extractDom = async (
  session: TapSession,
  frame: AutFrame,
  selector: string | undefined,
  maxChars: number,
): Promise<FrameDomResult> => {
  const { client, sessionId } = session

  const { executionContextId } = await client.Page.createIsolatedWorld({
    frameId: frame.frameId,
    worldName: 'cypress-tap',
  }, sessionId)

  const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
    functionDeclaration: DOM_FN,
    executionContextId,
    arguments: [{ value: selector ?? null }, { value: maxChars }],
    returnByValue: true,
  }, sessionId)

  if (exceptionDetails) {
    throw new FrameCommandError('FRAME_READ_FAILED', `reading the app-under-test DOM failed: ${exceptionDetails.exception?.description || exceptionDetails.text}`)
  }

  const value = result.value as DomFnResult

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
