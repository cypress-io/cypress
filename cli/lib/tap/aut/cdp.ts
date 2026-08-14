import type { TapConnection } from '../tap-connection'
import type { AutFrame } from './frame'
import { FrameCommandError } from './frame'

// A separate JS context that shares the frame's DOM but not its globals, so
// nothing the tap reads pollutes the page.
const TAP_WORLD_NAME = 'cypress-tap'

export const createFrameIsolatedWorld = async (connection: TapConnection, frame: AutFrame): Promise<number> => {
  const { client, sessionId } = connection

  const { executionContextId } = await client.Page.createIsolatedWorld({
    frameId: frame.frameId,
    worldName: TAP_WORLD_NAME,
  }, sessionId)

  return executionContextId
}

/**
 * Resolves a CSS selector to the matched element's CDP objectId, querying in an
 * isolated world on the AUT frame. `index` picks one of several matches
 * (`--at`), already checked against the match count by the caller. Throws
 * `INVALID_SELECTOR` when the selector is malformed; returns undefined when the
 * selector is valid but nothing matched.
 */
export const querySelectorObjectId = async (
  connection: TapConnection,
  frame: AutFrame,
  selector: string,
  index: number,
): Promise<string | undefined> => {
  const { client, sessionId } = connection
  const executionContextId = await createFrameIsolatedWorld(connection, frame)

  const { result, exceptionDetails } = await client.Runtime.callFunctionOn({
    functionDeclaration: 'function (selector, index) { return document.querySelectorAll(selector)[index] }',
    executionContextId,
    arguments: [{ value: selector }, { value: index }],
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
