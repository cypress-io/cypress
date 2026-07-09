import Debug from 'debug'
import type CRI from 'chrome-remote-interface'

const debug = Debug('cypress:cli:tap')

// The app names the AUT iframe deterministically (packages/app/src/runner/
// aut-iframe.ts): its name is `Your project: '<name>'`. That prefix is how we
// pick it out of the runner page's frame tree — distinct from the snapshot
// double-buffer frames (`AUT Snapshot - N`) and the spec bridge (`Your Spec`).
const AUT_FRAME_NAME_PREFIX = 'Your project:'

/**
 * A failure in a `tap frame` command, surfaced to the user as `{ code, message }`
 * via `renderFailure`. The frame commands are CLI-native and never cross the
 * binding's `exec` envelope, so this mirrors the binding's `TapCommandError`
 * on the CLI side.
 */
export class FrameCommandError extends Error {
  code: string

  constructor (code: string, message: string) {
    super(message)
    this.name = 'FrameCommandError'
    this.code = code
  }
}

export interface AutFrame {
  /** CDP frameId — scopes `Accessibility.getFullAXTree` and `Page.createIsolatedWorld`. */
  frameId: string
  url: string
}

interface FrameNode {
  frame: { id: string, name?: string, url?: string }
  childFrames?: FrameNode[]
}

const findAutFrame = (node: FrameNode): { id: string, url: string } | undefined => {
  if ((node.frame.name ?? '').startsWith(AUT_FRAME_NAME_PREFIX)) {
    return { id: node.frame.id, url: node.frame.url ?? '' }
  }

  for (const child of node.childFrames ?? []) {
    const found = findAutFrame(child)

    if (found) {
      return found
    }
  }

  return undefined
}

/**
 * Locates the app-under-test frame within the runner page. Verified empirically:
 * the AUT is a same-process child frame of the runner-page target, so one
 * attached session reaches it — no separate target attach. A pinned snapshot is
 * always same-super-domain, so it is reliably this child frame too.
 */
export const resolveAutFrame = async (client: CRI.Client, sessionId: string): Promise<AutFrame> => {
  await client.Page.enable({}, sessionId)

  // getFrameTree takes no params, so its typed signature is (sessionId?); CRI
  // routes the string arg to sessionId by type, not position.
  const { frameTree } = await client.Page.getFrameTree(sessionId)
  const found = findAutFrame(frameTree as FrameNode)

  if (!found) {
    throw new FrameCommandError('NO_AUT_FRAME', 'no app under test is loaded — run a spec first (and, to read a past command, pin it with the pin command)')
  }

  debug('resolved AUT frame %o', found)

  return { frameId: found.id, url: found.url }
}
