import Debug from 'debug'
import { randomUUID } from 'crypto'

import util, { DEVELOPMENT_VERSION } from '../util'
import { resolvedInstanceId } from '../cypress-instances'
import { detectAgent } from '@packages/agent-info'
import type { ReportedInvocation } from './reported-invocation'

const debug = Debug('cypress:cli:tap')

const CAMPAIGN = 'Tap Command'
const MEDIUM = 'tap-cli'
const POST_TIMEOUT_MS = 2000

// The same map the app reads through @packages/data-context; the CLI cannot reach
// that package, so the three URLs are duplicated here.
const CLOUD_URLS = {
  development: 'http://localhost:3000',
  staging: 'https://cloud-staging.cypress.io',
  production: 'https://cloud.cypress.io',
} as const

// Which collector the environment names, if it names one this CLI has a URL for.
// An unrecognized value is no collector at all, so a typo cannot pass for naming
// one and land a source checkout's traffic in the production analytics.
const namedCollectorEnv = (): keyof typeof CLOUD_URLS | undefined => {
  const named = process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV as keyof typeof CLOUD_URLS

  return Object.prototype.hasOwnProperty.call(CLOUD_URLS, named) ? named : undefined
}

const eventCollectorUrl = (includeMachineId = false): string => {
  return `${CLOUD_URLS[namedCollectorEnv() ?? 'production']}/${includeMachineId ? 'machine-collect' : 'anon-collect'}`
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

export const beginTapTrace = ({ command, flags }: ReportedInvocation): void => {
  trace = newTrace(command, flags)
}

// Names only: an option's value carries selectors, spec paths and test titles,
// so the trace takes the keys of what commander parsed, never the values.
export const noteTapCommand = (dispatched: string, ...parsed: Record<string, string>[]): void => {
  trace.command = dispatched
  trace.flags = [...new Set([...trace.flags, ...parsed.flatMap((values) => Object.keys(values))])]
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

  // This runs from the `finally` the CLI exits on, so nothing here may throw: a
  // failure while assembling the event would replace the command's own outcome.
  try {
    const cypressVersion = util.pkgVersion()

    // Local development reports nothing unless it names the collector to use, so
    // working on tap cannot put its own traffic in the production analytics.
    if (cypressVersion === DEVELOPMENT_VERSION && !namedCollectorEnv()) {
      debug('skipped tap event: development build')

      return
    }

    const payload = {
      command: trace.command,
      flags: trace.flags,
      agent: detectAgent(),
      instanceId: resolvedInstanceId() ?? undefined,
      exitCode,
      errorCode: trace.errorCode,
      durationMs: Date.now() - trace.startedAt,
    }

    const url = eventCollectorUrl()

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cypress-version': cypressVersion,
      },
      body: JSON.stringify({ campaign: CAMPAIGN, medium: MEDIUM, messageId: trace.messageId, payload }),
      signal: AbortSignal.timeout(POST_TIMEOUT_MS),
    })

    debug('recorded tap event to %s %o', url, payload)
  } catch (err) {
    debug('failed to record tap event for %o due to error %o', trace, err)
  }
}
