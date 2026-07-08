import { defineCommand, TapCommandError } from './definition'
import { resolveMaxChars, serializeElements, serializeMatches } from './dom-serialize'
import type { MatchesResult } from './dom-serialize'

export interface DomResult {
  /** The AUT's current url. */
  url?: string
  /** The live document HTML — absent when a selector scopes the read. */
  html?: string
  /** The elements the selector matched; count 0 is a result, not a failure. */
  matches?: MatchesResult
  /** Present when any HTML was cut by the max-chars budget. */
  truncated?: true
}

/**
 * Seam over the live AUT document (component tests stub it). Undefined both
 * before any page has loaded and while the AUT is mid-navigation or on an
 * origin the driver cannot reach. Reads through the event manager's Cypress,
 * never `window.Cypress` (cypress-in-cypress hands that to the outer driver).
 */
export const tapLiveDom = {
  getDocument (): Document | undefined {
    try {
      return window.getEventManager?.().getCypress()?.state('document') ?? undefined
    } catch {
      return undefined
    }
  },
}

const readUrl = (doc: Document): string | undefined => {
  try {
    return doc.location?.href ?? undefined
  } catch {
    return undefined
  }
}

export const domCommand = defineCommand({
  description: 'read the current DOM of the app under test: page HTML, or just the elements matching a selector',
  params: [
    { name: 'selector', type: 'string', required: false, description: 'CSS selector: return only the matching elements instead of the page HTML' },
  ],
  options: [
    { name: 'max-chars', type: 'number', required: false, description: 'cap on returned HTML characters (default 30000); the result carries truncated: true when cut' },
  ],
  handler: async ({ selector }, { 'max-chars': maxCharsRaw }): Promise<DomResult> => {
    const maxChars = resolveMaxChars(maxCharsRaw)
    const doc = tapLiveDom.getDocument()

    if (!doc) {
      throw new TapCommandError('NO_DOM', 'the app under test has no readable document — run a spec that visits a page first, or use the snapshot command to read a past command’s DOM')
    }

    const url = readUrl(doc)
    const result: DomResult = {
      ...(url !== undefined ? { url } : {}),
    }

    let truncated = false

    if (selector !== undefined) {
      const scoped = serializeMatches(doc, selector, maxChars)

      result.matches = scoped.matches
      truncated = scoped.truncated
    } else {
      const root = doc.documentElement

      if (!root) {
        throw new TapCommandError('NO_DOM', 'the app under test has no readable document — run a spec that visits a page first, or use the snapshot command to read a past command’s DOM')
      }

      const page = serializeElements([root], maxChars)

      result.html = page.html[0] ?? ''
      truncated = page.truncated
    }

    if (truncated) {
      result.truncated = true
    }

    return result
  },
})
