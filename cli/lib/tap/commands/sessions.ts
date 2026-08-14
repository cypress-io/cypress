import { isTapSupportedBrowser, listLiveSessions } from '../../cypress-sessions'
import type { LiveSessionState, ReadySessionState } from '../../cypress-sessions'
import { renderOutcome, renderResult } from '../output'
import { withTapConnection } from '../tap-connection'
import { FIND_SESSION_TIMEOUT_MS, isRendererUnresponsive } from '../cdp-timeout'
import { defineNativeCommand } from './definition'
import type { TapCliOptions } from '../types'

const NO_SESSIONS_GUIDANCE = 'No running Cypress session found. Start Cypress in open mode (e.g. `cypress open`) and select a testing type to get started.'

/** One row of `cypress tap sessions`: a reachable open-mode Cypress session. */
export interface TapSessionSummary {
  /** Process id — the handle other tap commands accept via `--session`. */
  pid: number
  /** Absolute path of the project the session has open. */
  projectRoot: string
  /** Testing type the session has open, or `null` before one is chosen. */
  testingType: 'e2e' | 'component' | null
  /** Whether the session has a browser attached over CDP. */
  browserAttached: boolean
  /** Display name of the browser the session has open (e.g. `Chrome`), or `null` when none is open. */
  browserName: string | null
  /** Whether tap can drive the browser the session has open — tap supports only Chromium based browsers. */
  browserSupported: boolean
  /**
   * Whether the runner page answered. `browserAttached` only says the browser
   * process is reachable, so this is what separates a healthy session from one
   * whose page is wedged — the state in which every other command fails. Absent
   * when there is no runner page to ask.
   */
  rendererResponsive?: boolean
}

// Bounded, and never throws: `sessions` is what a caller reaches for when
// everything else is failing, so an unanswered probe is a reported fact rather
// than an error. Absent means there was nothing to ask, not that it went unasked.
const probeRenderer = async (session: LiveSessionState, timeoutMs: number): Promise<boolean | undefined> => {
  if (session.cdpBrowserWsUrl === null) {
    return undefined
  }

  try {
    return await withTapConnection(session as ReadySessionState, async () => true, timeoutMs)
  } catch (err) {
    return isRendererUnresponsive(err) ? false : undefined
  }
}

const listSessions = async (options: TapCliOptions): Promise<number> => {
  const sessions = await listLiveSessions({ session: options.session })

  if (sessions.length === 0) {
    renderResult(NO_SESSIONS_GUIDANCE)

    return 0
  }

  const timeoutMs = options.timeout ?? FIND_SESSION_TIMEOUT_MS
  const responsive = await Promise.all(sessions.map((session) => probeRenderer(session, timeoutMs)))

  const summaries: TapSessionSummary[] = sessions.map((session, index) => ({
    pid: session.pid,
    projectRoot: session.projectRoot,
    testingType: session.testingType,
    browserAttached: session.cdpBrowserWsUrl !== null,
    browserName: session.browserName,
    browserSupported: isTapSupportedBrowser(session.browserFamily),
    ...(responsive[index] === undefined ? {} : { rendererResponsive: responsive[index] }),
  }))

  renderOutcome('sessions', summaries, options.json)

  return 0
}

export const sessionsCommand = defineNativeCommand('sessions', listSessions)
