import type { TapSession } from '../tap-session'
import type { AutFrame } from './frame'
import { FrameCommandError } from './frame'

// A separate JS context that shares the frame's DOM but not its globals, so
// nothing the tap reads pollutes the page.
const TAP_WORLD_NAME = 'cypress-tap'

export const createFrameIsolatedWorld = async (session: TapSession, frame: AutFrame): Promise<number> => {
  const { client, sessionId } = session

  const { executionContextId } = await client.Page.createIsolatedWorld({
    frameId: frame.frameId,
    worldName: TAP_WORLD_NAME,
  }, sessionId)

  return executionContextId
}

/**
 * Resolves a CSS selector to the matched element's CDP objectId, running
 * `querySelector` in an isolated world on the AUT frame. Throws
 * `INVALID_SELECTOR` when the selector is malformed; returns undefined when the
 * selector is valid but nothing matched.
 */
export const querySelectorObjectId = async (
  session: TapSession,
  frame: AutFrame,
  selector: string,
): Promise<string | undefined> => {
  const { client, sessionId } = session
  const executionContextId = await createFrameIsolatedWorld(session, frame)

  const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
    functionDeclaration: 'function (selector) { return document.querySelector(selector) }',
    executionContextId,
    arguments: [{ value: selector }],
  }, sessionId)

  if (exceptionDetails) {
    throw new FrameCommandError('INVALID_SELECTOR', `"${selector}" is not a valid CSS selector`)
  }

  // querySelector returned null — a real "nothing matched" answer, not an error.
  if (!result.objectId || result.subtype === 'null') {
    return undefined
  }

  return result.objectId
}

export interface AXValue { value?: unknown }

export interface AXProperty { name: string, value?: AXValue }

/**
 * The subset of a node's boolean accessibility properties present in `reported`
 * and currently true — the states worth surfacing; the rest are rarely
 * actionable.
 */
export const collectTrueStates = (properties: AXProperty[] | undefined, reported: Set<string>): string[] => {
  return (properties ?? [])
  .filter((property) => reported.has(property.name) && property.value?.value === true)
  .map((property) => property.name)
}
