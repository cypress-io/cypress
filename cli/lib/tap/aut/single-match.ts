import type { TapSession } from '../tap-session'
import { createFrameIsolatedWorld } from './cdp'
import { FrameCommandError } from './frame'
import type { AutFrame } from './frame'
import { countMatches } from './scripts'
import type { MatchCountResult } from './scripts'

/**
 * What a selector-taking AUT read returns in place of the read when the selector
 * matched more than one element: how many it matched. Not a failure — it is the
 * answer to "which one did you mean?", so it exits 0 and honors `--json` like
 * any other result.
 */
export interface FrameAmbiguousResult {
  /** Always `true` — marks this as the ambiguity answer rather than a read. */
  ambiguous: true
  /** The selector that matched more than one element. */
  selector: string
  /** How many elements it matched. */
  count: number
}

/**
 * Resolves what a selector-taking AUT read should do: `undefined` to go ahead —
 * the selector matched one element, or none (which each command reports in its
 * own shape), or `at` named which match to read — or the ambiguity answer to
 * return in place of the read, so a reader is never silently shown one arbitrary
 * match of several.
 */
export const resolveMatch = async (
  session: TapSession,
  frame: AutFrame,
  selector: string | undefined,
  at?: number,
): Promise<FrameAmbiguousResult | undefined> => {
  if (selector === undefined) {
    if (at !== undefined) {
      throw new FrameCommandError('INVALID_INDEX', 'at needs a selector to index into — without one there is only the one frame to read')
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
    throw new FrameCommandError('FRAME_READ_FAILED', `resolving "${selector}" in the app under test failed: ${exceptionDetails.exception?.description || exceptionDetails.text}`)
  }

  const { count, invalidSelector } = result.value as MatchCountResult

  if (invalidSelector) {
    throw new FrameCommandError('INVALID_SELECTOR', `"${selector}" is not a valid CSS selector`)
  }

  // Nothing matched: each command reports that in its own shape, and an `at`
  // has no range to be out of.
  if (count === undefined || count === 0) {
    return undefined
  }

  if (at !== undefined) {
    if (at >= count) {
      throw new FrameCommandError('INVALID_INDEX', `at ${at} is out of range: "${selector}" matched ${count} element${count === 1 ? '' : 's'}, so the index must be 0-${count - 1}`)
    }

    return undefined
  }

  if (count === 1) {
    return undefined
  }

  return { ambiguous: true, selector, count }
}
