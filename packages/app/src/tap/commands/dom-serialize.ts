import { TapCommandError } from './definition'

// Character budget for returned HTML when the caller does not pass max-chars.
// Sized for an LLM consumer: big enough for a typical page body, small enough
// that an unscoped read of a heavy page cannot flood the conversation.
const DEFAULT_MAX_CHARS = 30000

export const resolveMaxChars = (maxChars: number | undefined): number => {
  if (maxChars === undefined) {
    return DEFAULT_MAX_CHARS
  }

  if (!Number.isInteger(maxChars) || maxChars <= 0) {
    throw new TapCommandError('INVALID_MAX_CHARS', 'max-chars must be a positive integer (the cap on returned HTML characters)')
  }

  return maxChars
}

export interface SerializedHtml {
  html: string[]
  truncated: boolean
}

/**
 * Serializes elements to outerHTML under a shared character budget: elements
 * are emitted whole until one would cross the budget; that one is cut and the
 * rest dropped, with `truncated` telling the caller to report the cut.
 */
export const serializeElements = (elements: ArrayLike<Element>, maxChars: number): SerializedHtml => {
  const html: string[] = []
  let remaining = maxChars

  for (let i = 0; i < elements.length; i++) {
    const outer = elements[i].outerHTML

    if (outer.length > remaining) {
      if (remaining > 0) {
        html.push(outer.slice(0, remaining))
      }

      return { html, truncated: true }
    }

    html.push(outer)
    remaining -= outer.length
  }

  return { html, truncated: false }
}

export interface MatchesResult {
  count: number
  html: string[]
}

/**
 * Runs a CSS selector against a snapshot body or live document and serializes
 * the matches under the budget. `count` is always the full match count, even
 * when the serialized list was cut short.
 */
export const serializeMatches = (root: ParentNode, selector: string, maxChars: number): { matches: MatchesResult, truncated: boolean } => {
  let found: ArrayLike<Element>

  try {
    found = root.querySelectorAll(selector)
  } catch {
    throw new TapCommandError('INVALID_SELECTOR', `"${selector}" is not a valid CSS selector`)
  }

  const { html, truncated } = serializeElements(found, maxChars)

  return { matches: { count: found.length, html }, truncated }
}
