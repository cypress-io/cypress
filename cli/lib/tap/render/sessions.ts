import chalk from 'chalk'

import type { TapSessionSummary } from '../commands/sessions'
import { color, columns, layout, panel } from './format'

/** The facts an session row shows — carried by a summary, and by a status. */
export interface SessionRow {
  pid: number
  projectRoot: string
  testingType: 'e2e' | 'component' | null
  browserName: string | null
  browserAttached?: boolean
  browserSupported?: boolean
  rendererResponsive?: boolean
}

// An open browser reads by its name alone only when tap can actually drive it;
// each way that can fail — a browser tap does not support, one it has lost its
// connection to, one whose page will not answer — is the state every other
// command fails in, so each says which.
const browserState = (session: SessionRow): string | null => {
  if (session.browserSupported === false) {
    return 'unsupported'
  }

  if (session.browserAttached === false) {
    return 'not attached'
  }

  return session.rendererResponsive === false ? 'not responding' : null
}

const browserCell = (session: SessionRow): string => {
  if (session.browserName === null) {
    return '—'
  }

  const state = browserState(session)

  return state === null ? session.browserName : `${session.browserName} (${state})`
}

const browserColor = (session: SessionRow) => {
  if (session.browserName === null) {
    return color.muted
  }

  const state = browserState(session)

  if (state === null) {
    return color.pass
  }

  return state === 'unsupported' ? color.warn : color.aborted
}

// One row per session. PID is bold — it's the handle the other tap commands
// accept via `--session` — and an attached browser reads green by its name, an
// absent one (or testing type) as a muted dash.
export const sessionColumns = (sessions: SessionRow[]): string[] => {
  const rows = sessions.map((session) => [
    String(session.pid),
    session.projectRoot,
    session.testingType ?? '—',
    browserCell(session),
  ])

  return columns(['PID', 'PROJECT', 'TYPE', 'BROWSER'], rows, (cells, index) => [
    chalk.bold(cells[0]),
    cells[1],
    cells[2],
    browserColor(sessions[index])(cells[3]),
  ])
}

// The reachable open-mode sessions under a counted heading.
export const renderSessionsHuman = (sessions: TapSessionSummary[]): string => {
  return layout([panel('SESSIONS', sessions.length, sessionColumns(sessions))])
}
