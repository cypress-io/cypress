import { TAP_EXEC_METHOD, TapError } from '@packages/cypress-instances'
import type { ResolveSelectorMatch, ResolveSelectorResult } from '@packages/cypress-instances'

import { validateExecResult } from '../tap-session'
import type { TapSession } from '../tap-session'
import { createFrameIsolatedWorld } from './cdp'
import { invalidSelectorError } from './frame'
import type { AutFrame } from './frame'
import { countMatches } from './scripts'
import type { MatchCountResult } from './scripts'

/**
 * What a selector-taking AUT read returns in place of the read when the selector
 * matched more than one element: how many it matched, and a selector unique to
 * each, to re-run with. It is the answer to "which one did you mean?", so it
 * prints and honors `--json` like any other result — but the read never
 * happened, so the command exits 1.
 */
export interface FrameAmbiguousResult {
  /** Always `true` — marks this as the ambiguity answer rather than a read. */
  ambiguous: true
  /** The selector that matched more than one element. */
  selector: string
  /** How many elements it matched. */
  count: number
  /**
   * One entry per match, in document order, each carrying the index of the match
   * it names and a selector unique to it — `null` where none could be derived.
   * May be shorter than `count`: the instance only derives so many.
   */
  selectors: ResolveSelectorMatch[]
}

/**
 * A unique selector for each match, to offer in place of the ambiguous one.
 * Best effort: these come from the instance itself, which derives them the way
 * its Selector Playground does — so they honor any selectorPriority the project
 * configured, and are selectors the user's own tests would use. An instance that
 * can't reach its app under test (a secondary origin inside `cy.origin`) just
 * leaves the match count to speak for itself.
 */
const disambiguatingSelectors = async (session: TapSession, selector: string): Promise<ResolveSelectorMatch[]> => {
  try {
    const outcome = validateExecResult(await session.call(TAP_EXEC_METHOD, ['resolve-selector', { selector }, {}]))

    return 'error' in outcome ? [] : (outcome.result as ResolveSelectorResult).selectors
  } catch {
    return []
  }
}

export const resolveAmbiguity = async (
  session: TapSession,
  frame: AutFrame,
  selector: string | undefined,
  at?: number,
): Promise<FrameAmbiguousResult | undefined> => {
  if (selector === undefined) {
    if (at !== undefined) {
      throw new TapError('INVALID_INDEX', { detail: 'The `--at` option needs a selector to index into. Pass `--selector` alongside it.' })
    }

    return undefined
  }

  const { client, sessionId } = session
  const executionContextId = await createFrameIsolatedWorld(session, frame)

  const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
    functionDeclaration: countMatches.toString(),
    executionContextId,
    arguments: [{ value: selector }],
    returnByValue: true,
  }, sessionId)

  if (exceptionDetails) {
    throw new TapError('FRAME_READ_FAILED', { message: `resolving "${selector}" in the app under test failed: ${exceptionDetails.exception?.description || exceptionDetails.text}` })
  }

  const { count, invalidSelector } = result.value as MatchCountResult

  if (invalidSelector) {
    throw invalidSelectorError(selector)
  }

  // Nothing matched: each command reports that in its own shape, and an `--at`
  // has no range to be out of.
  if (count === undefined || count === 0) {
    return undefined
  }

  if (at !== undefined) {
    if (at >= count) {
      throw new TapError('INVALID_INDEX', { detail: `"${selector}" matched ${count} element${count === 1 ? '' : 's'}, so \`--at\` takes 0 to ${count - 1}.` })
    }

    return undefined
  }

  if (count === 1) {
    return undefined
  }

  return {
    ambiguous: true,
    selector,
    count,
    selectors: await disambiguatingSelectors(session, selector),
  }
}

export const withAmbiguous = async <T>(
  session: TapSession,
  frame: AutFrame,
  selector: string | undefined,
  at: number | undefined,
  read: () => Promise<T>,
): Promise<T | FrameAmbiguousResult> => {
  const ambiguous = await resolveAmbiguity(session, frame, selector, at)

  return ambiguous ?? read()
}
