import Debug from 'debug'
import { randomUUID } from 'crypto'

import util, { DEVELOPMENT_VERSION } from '../util'
import { resolvedInstanceIdentity } from '../cypress-sessions'
import { detectAgent } from '@packages/agent-info'
import type { ReportedInvocation } from './reported-invocation'

const debug = Debug('cypress:cli:tap')

const CAMPAIGN = 'Tap Command'
const MEDIUM = 'tap-cli'
const POST_TIMEOUT_MS = 2000

// Only flags a command declares reach a trace, and no command declares close to
// this many, so the cap is a backstop rather than the real bound.
const MAX_REPORTED_FLAGS = 25

// Duplicated from packages/data-context/src/util/cloudUrls.ts, which the CLI
// cannot import.
const CLOUD_URLS = {
  development: 'http://localhost:3000',
  staging: 'https://cloud-staging.cypress.io',
  production: 'https://cloud.cypress.io',
} as const

// Which collector the environment names, if it names one this CLI has a URL for:
// the collector variable the app reads (see EventCollectorActions), then the
// internal environment it is normally derived from. An unrecognized value is no
// collector at all, so a typo cannot pass for naming one and land a source
// checkout's traffic in the production analytics.
const namedCollectorEnv = (): keyof typeof CLOUD_URLS | undefined => {
  const named = (process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV ?? process.env.CYPRESS_INTERNAL_ENV) as keyof typeof CLOUD_URLS

  return Object.prototype.hasOwnProperty.call(CLOUD_URLS, named) ? named : undefined
}

const eventCollectorUrl = (includeMachineId = false): string => {
  return `${CLOUD_URLS[namedCollectorEnv() ?? 'production']}/${includeMachineId ? 'machine-collect' : 'anon-collect'}`
}

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
  // This runs from the `finally` the CLI exits on, so nothing here may throw: a
  // failure while assembling the event would replace the command's own outcome.
  try {
    // Read through getEnv so the opt-out can also come from npm config, the way
    // the CLI's other public variables are set.
    if (util.getEnv('CYPRESS_DISABLE_GUEST_TELEMETRY')) {
      debug('skipped tap event: telemetry disabled')

      return
    }

    const cypressVersion = util.pkgVersion()

    // Local development reports nothing unless it names the collector to use, so
    // working on tap cannot put its own traffic in the production analytics.
    if (cypressVersion === DEVELOPMENT_VERSION && !namedCollectorEnv()) {
      debug('skipped tap event: development build')

      return
    }

    const identity = resolvedInstanceIdentity()

    const payload = {
      command: trace.command,
      flags: trace.flags.slice(0, MAX_REPORTED_FLAGS),
      agent: detectAgent(),
      instanceId: identity?.instanceId ?? undefined,
      userId: identity?.userId ?? undefined,
      exitCode,
      errorCode: trace.errorCode,
      durationMs: Date.now() - trace.startedAt,
    }

    // The identity travels in the instance probe response, so an invocation that
    // never resolved an instance has no machineId and stays on the anonymous
    // collector, mirroring EventCollectorActions.recordEvent app-side.
    const machineId = identity?.machineId ?? undefined
    const url = eventCollectorUrl(machineId !== undefined)

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cypress-version': cypressVersion,
      },
      body: JSON.stringify({ campaign: CAMPAIGN, medium: MEDIUM, messageId: trace.messageId, machineId, payload }),
      signal: AbortSignal.timeout(POST_TIMEOUT_MS),
    })

    debug('recorded tap event to %s %o', url, payload)
  } catch (err) {
    debug('failed to record tap event for %o due to error %o', trace, err)
  }
}
