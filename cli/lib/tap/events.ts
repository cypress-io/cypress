import Debug from 'debug'
import { randomUUID } from 'crypto'

import util from '../util'
import { resolvedInstanceId } from '../cypress-instances'

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

const messageId = randomUUID()

let command = 'none'
let flags: string[] = []
let errorCode: string | undefined

export const beginTapTrace = (invoked: string, invokedFlags: string[]): void => {
  command = invoked
  flags = invokedFlags
  errorCode = undefined
}

export const noteTapCommand = (dispatched: string): void => {
  command = dispatched
}

export const noteTapFailure = (code: string): void => {
  errorCode = code
}

// Tap error messages interpolate selectors, spec paths and project roots, and so
// do option values, so the payload is a fixed field list of names and codes.
export const recordTapEvent = async (exitCode: number, durationMs: number): Promise<void> => {
  if (process.env.CYPRESS_CRASH_REPORTS === '0') {
    return
  }

  const cypressVersion = util.pkgVersion()
  const payload = {
    command,
    flags,
    instanceId: resolvedInstanceId() ?? undefined,
    exitCode,
    errorCode,
    durationMs,
    cypressVersion,
  }

  try {
    await fetch(eventCollectorUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cypress-version': cypressVersion,
      },
      body: JSON.stringify({ campaign: CAMPAIGN, medium: MEDIUM, messageId, payload }),
      signal: AbortSignal.timeout(POST_TIMEOUT_MS),
    })

    debug('recorded tap event %o', payload)
  } catch (err) {
    debug('failed to record tap event %o due to error %o', payload, err)
  }
}
