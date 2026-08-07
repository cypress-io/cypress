import Debug from 'debug'
import { randomUUID } from 'crypto'

import util from '../util'
import { resolvedInstanceId } from '../cypress-instances'
import { detectAgent } from '@packages/agent-info'

const debug = Debug('cypress:cli:tap')

const CAMPAIGN = 'Tap Command'
const MEDIUM = 'cli'
const POST_TIMEOUT_MS = 2000

// The same map the app reads through @packages/data-context; the CLI cannot reach
// that package, so the three URLs are duplicated here.
const CLOUD_URLS = {
  development: 'http://localhost:3000',
  staging: 'https://cloud-staging.cypress.io',
  production: 'https://cloud.cypress.io',
} as const

const eventCollectorUrl = (includeMachineId = false): string => {
  const collectorEnv = process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV as keyof typeof CLOUD_URLS
  const cloudUrl = CLOUD_URLS[Object.prototype.hasOwnProperty.call(CLOUD_URLS, collectorEnv) ? collectorEnv : 'production']

  return `${cloudUrl}/${includeMachineId ? 'machine-collect' : 'anon-collect'}`
}

// What the invocation turned out to be, accumulated as it runs. `beginTapTrace`
// opens one the moment the CLI knows what was typed, the `note` calls refine it
// as the command resolves and fails, and `reportTapTrace` posts it once, just
// before the process exits.
interface TapTrace {
  messageId: string
  startedAt: number
  command: string
  flags: string[]
  errorCode?: string
}

const newTrace = (command = 'none', flags: string[] = []): TapTrace => ({
  messageId: randomUUID(),
  startedAt: Date.now(),
  command,
  flags,
})

let trace = newTrace()

export const beginTapTrace = (command: string | undefined, flags: string[]): void => {
  trace = newTrace(command, flags)
}

export const noteTapCommand = (dispatched: string): void => {
  trace.command = dispatched
}

export const noteTapFailure = (code: string): void => {
  trace.errorCode = code
}

// Tap error messages interpolate selectors, spec paths and project roots, and so
// do option values, so the payload is a fixed field list of names and codes —
// spelled out here rather than spread from the trace, so a new trace field
// cannot silently become a new wire field.
export const reportTapTrace = async (exitCode: number): Promise<void> => {
  if (process.env.CYPRESS_CRASH_REPORTS === '0') {
    return
  }

  const cypressVersion = util.pkgVersion()
  const payload = {
    command: trace.command,
    flags: trace.flags,
    agent: detectAgent(),
    instanceId: resolvedInstanceId() ?? undefined,
    exitCode,
    errorCode: trace.errorCode,
    durationMs: Date.now() - trace.startedAt,
    cypressVersion,
  }

  try {
    await fetch(eventCollectorUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cypress-version': cypressVersion,
      },
      body: JSON.stringify({ campaign: CAMPAIGN, medium: MEDIUM, messageId: trace.messageId, payload }),
      signal: AbortSignal.timeout(POST_TIMEOUT_MS),
    })

    debug('recorded tap event %o', payload)
  } catch (err) {
    debug('failed to record tap event %o due to error %o', payload, err)
  }
}
