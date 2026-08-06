import type { TapSession } from '../tap-session'
import { createFrameIsolatedWorld } from './cdp'
import { FrameCommandError } from './frame'
import type { AutFrame } from './frame'
import { countMatches } from './scripts'
import type { MatchCountResult } from './scripts'

/**
 * What a selector-taking AUT read returns in place of the read when the selector
 * matched more than one element: how many it matched. It is the answer to "which
 * one did you mean?", so it prints and honors `--json` like any other result —
 * but the read never happened, so the command exits 1.
 */
export interface FrameAmbiguousResult {
  /** Always `true` — marks this as the ambiguity answer rather than a read. */
  ambiguous: true
  /** The selector that matched more than one element. */
  selector: string
  /** How many elements it matched. */
  count: number
}

export const resolveAmbiguity = async (
  session: TapSession,
  frame: AutFrame,
  selector: string | undefined,
  at?: number,
): Promise<FrameAmbiguousResult | undefined> => {
  if (selector === undefined) {
    if (at !== undefined) {
      throw new FrameCommandError('INVALID_INDEX', 'at needs a selector to index into')
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
      throw new FrameCommandError('INVALID_INDEX', `"${selector}" matched ${count} element${count === 1 ? '' : 's'}; pass at 0-${count - 1}`)
    }

    return undefined
  }

  if (count === 1) {
    return undefined
  }

  return { ambiguous: true, selector, count }
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
