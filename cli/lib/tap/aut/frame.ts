import Debug from 'debug'
import type CRI from 'chrome-remote-interface'

import { resolveInstance } from '../../cypress-instances'
import { withTapSession, validateExecResult } from '../tap-session'
import type { TapSession } from '../tap-session'
import { renderOutcome, renderTapFailure } from '../output'
import type { TapCliOptions, TapRunState } from '../types'
import type { FrameAmbiguousResult } from './single-match'
import { TAP_EXEC_METHOD, TapError } from '@packages/cypress-instances'
import type { TapErrorCode } from '@packages/cypress-instances'

const debug = Debug('cypress:cli:tap')

// The app names the AUT iframe deterministically (packages/app/src/runner/
// aut-iframe.ts): its name is `Your project: '<name>'`. That prefix is how we
// pick it out of the runner page's frame tree — distinct from the snapshot
// double-buffer frames (`AUT Snapshot - N`) and the spec bridge (`Your Spec`).
const AUT_FRAME_NAME_PREFIX = 'Your project:'

// Three readers reject a malformed selector (the match counter, the DOM reader, and
// the single-node lookup), and the app-side `resolve-selector` reports the same
// condition over the wire — they must all say it the same way.
export const invalidSelectorError = (selector: string): TapError => {
  return new TapError('INVALID_SELECTOR', { detail: `The selector was "${selector}".` })
}

export interface AutFrame {
  /** CDP frameId — scopes `Accessibility.getFullAXTree` and `Page.createIsolatedWorld`. */
  frameId: string
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
    throw new TapError('NO_AUT')
  }

  debug('resolved AUT frame %o', found)

  return { frameId: found.id }
}

/**
 * Gates the AUT-frame reads on the same run lifecycle `status` reports. The
 * frame is only worth reading once a spec has settled: while a spec is running
 * the app is in flux — commands are still executing, snapshots are swapping,
 * the page may still be navigating — so a read captures a transient page; and
 * short of a verdict, with no run of its own to read, the resolved frame is the
 * runner shell or the run this one displaces. Both are rejected with typed
 * errors a poller can branch on, mirroring the `status` lifecycle contract
 * (wait until `passed`/`failed`).
 */
export const assertFrameReadable = async (session: TapSession): Promise<void> => {
  const outcome = validateExecResult(await session.call(TAP_EXEC_METHOD, ['run-state', {}, {}]))

  if ('error' in outcome) {
    // The instance already named the condition; re-raise it as ours so it renders
    // through the one path rather than being reported as a frame read failure.
    throw new TapError(outcome.error.code as TapErrorCode, { detail: outcome.error.detail })
  }

  const { state } = outcome.result as TapRunState

  if (state === 'running') {
    throw new TapError('RUN_IN_PROGRESS')
  }

  if (state !== 'passed' && state !== 'failed') {
    throw new TapError('NO_RUN')
  }
}

/**
 * Shared flow for the AUT-frame commands: resolve a running instance, open a
 * tap session, gate on the run lifecycle, locate the AUT frame, run `read`, and
 * render the result. Every failure along the way — the read's own, the run-state
 * gate's, discovery's, transport's — is a `TapError`, so one catch renders them
 * all the way the schema commands render theirs.
 */
export const withResolvedAutFrame = async (
  options: TapCliOptions,
  read: (session: TapSession, frame: AutFrame) => Promise<unknown>,
  command: string,
): Promise<number> => {
  try {
    const selection = await resolveInstance({ instance: options.instance, cwd: process.cwd() })

    return await withTapSession(selection.instance, async (session) => {
      await assertFrameReadable(session)

      const frame = await resolveAutFrame(session.client, session.sessionId)

      const result = await read(session, frame)

      renderOutcome(command, result, options.json)

      // The ambiguity answer is still a result — it names the matches to
      // choose between, so it prints on stdout like any other. But it is not
      // the read that was asked for, and the exit code has to say so.
      return (result as FrameAmbiguousResult).ambiguous ? 1 : 0
    }, options.timeout)
  } catch (err: any) {
    return await renderTapFailure(err)
  }
}
