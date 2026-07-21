import Debug from 'debug'
import type CRI from 'chrome-remote-interface'

import { CypressInstanceError, resolveInstance } from '../cypress-instances'
import { withTapSession } from './tap-session'
import type { TapSession } from './tap-session'
import { renderResult, renderFailure, renderKnownFailure } from './output'
import type { TapCliOptions } from './types'

const debug = Debug('cypress:cli:tap')

// The app names the AUT iframe deterministically (packages/app/src/runner/
// aut-iframe.ts): its name is `Your project: '<name>'`. That prefix is how we
// pick it out of the runner page's frame tree — distinct from the snapshot
// double-buffer frames (`AUT Snapshot - N`) and the spec bridge (`Your Spec`).
const AUT_FRAME_NAME_PREFIX = 'Your project:'

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

export const parsePositiveInt = (raw: string | undefined, fallback: number, label: string): number => {
  if (raw === undefined) {
    return fallback
  }

  const value = Number(raw)

  if (!Number.isInteger(value) || value <= 0) {
    throw new FrameCommandError('INVALID_LIMIT', `${label} must be a positive integer`)
  }

  return value
}

/**
 * Shared flow for the AUT-frame commands: resolve a running instance, open a
 * tap session, locate the AUT frame, run `read`, and render the result. Maps
 * the CLI-native `FrameCommandError` and the discovery/transport failures to
 * the same rendered output the schema commands use.
 */
export const withResolvedAutFrame = async (
  options: TapCliOptions,
  read: (session: TapSession, frame: AutFrame) => Promise<unknown>,
): Promise<number> => {
  try {
    const selection = await resolveInstance({ instance: options.instance, cwd: process.cwd() })

    return await withTapSession(selection.instance, async (session) => {
      const frame = await resolveAutFrame(session.client, session.sessionId)

      try {
        renderResult(await read(session, frame))

        return 0
      } catch (err: any) {
        if (err instanceof FrameCommandError) {
          renderFailure({ code: err.code, message: err.message })

          return 1
        }

        throw err
      }
    })
  } catch (err: any) {
    if (err instanceof CypressInstanceError) {
      renderFailure(err)

      return 1
    }

    if (err.known && err.details) {
      renderKnownFailure(err)

      return 1
    }

    throw err
  }
}
