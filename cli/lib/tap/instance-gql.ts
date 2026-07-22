import Debug from 'debug'

import { errors } from '../errors'
import { throwTapError } from './tap-session'
import type { LiveInstanceState } from '../cypress-instances'

const debug = Debug('cypress:cli:tap')

const GRAPHQL_HOST = '127.0.0.1'
// The app server mounts the full GraphQL schema under its reserved namespace
// (packages/server/lib/routes.ts), on the same port the discovery record
// already carries — no separate port handshake is needed.
const GRAPHQL_PATH = '/__cypress/graphql'
const DEFAULT_QUERY_TIMEOUT_MS = 4000

interface InstanceGraphqlQuery {
  operationName: string
  query: string
  variables?: Record<string, unknown>
}

interface GraphqlEnvelope {
  data?: unknown
  errors?: unknown
}

const firstErrorMessage = (envelopeErrors: unknown): string | null => {
  const first = Array.isArray(envelopeErrors) ? envelopeErrors[0] as { message?: unknown } | null : undefined

  if (first === undefined) {
    return null
  }

  return typeof first?.message === 'string' ? first.message : 'The instance reported an unnamed GraphQL error.'
}

const validateEnvelope = <T>(operationName: string, envelope: GraphqlEnvelope | null): T => {
  if (!envelope || typeof envelope !== 'object') {
    return throwTapError(errors.tapGraphqlFailed, `The instance answered ${operationName} with an unrecognizable response.`)
  }

  const errorMessage = firstErrorMessage(envelope.errors)

  if (errorMessage !== null) {
    return throwTapError(errors.tapGraphqlFailed, `The instance failed to run ${operationName}: ${errorMessage}`)
  }

  if (!envelope.data || typeof envelope.data !== 'object') {
    return throwTapError(errors.tapGraphqlFailed, `The instance answered ${operationName} without data.`)
  }

  return envelope.data as T
}

export const queryInstanceGraphql = async <T = unknown>(instance: LiveInstanceState, request: InstanceGraphqlQuery, timeoutMs: number = DEFAULT_QUERY_TIMEOUT_MS): Promise<T> => {
  const url = `http://${GRAPHQL_HOST}:${instance.serverPort}${GRAPHQL_PATH}/${request.operationName}`

  let response: { status: number, json (): Promise<unknown> }

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ variables: {}, ...request }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err: any) {
    debug('graphql request %s to pid %d failed: %o', request.operationName, instance.pid, err)

    return throwTapError(errors.tapGraphqlUnreachable, `Could not reach the instance to run ${request.operationName}: ${err.message}`, err)
  }

  if (response.status !== 200) {
    return throwTapError(errors.tapGraphqlUnreachable, `The instance answered ${request.operationName} with status ${response.status}.`)
  }

  const envelope = await response.json().catch((err) => {
    return throwTapError(errors.tapGraphqlFailed, `The instance answered ${request.operationName} with a non-JSON response.`, err)
  })

  return validateEnvelope<T>(request.operationName, envelope as GraphqlEnvelope | null)
}
