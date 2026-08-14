import Debug from 'debug'

import { errors } from '../errors'
import { throwTapError } from './tap-connection'
import type { LiveSessionState } from '../cypress-sessions'
import { SESSION_ID_HEADER } from '@packages/cypress-sessions'
import type { TapGraphqlOperation } from '@packages/cypress-sessions'

const debug = Debug('cypress:cli:tap')

const GRAPHQL_HOST = '127.0.0.1'
const GRAPHQL_PATH = '/__cypress/graphql'
const DEFAULT_QUERY_TIMEOUT_MS = 4000

interface GraphqlEnvelope {
  data?: unknown
  errors?: unknown
}

const firstErrorMessage = (envelopeErrors: unknown): string | null => {
  const first = Array.isArray(envelopeErrors) ? envelopeErrors[0] as { message?: unknown } | null : undefined

  if (first === undefined) {
    return null
  }

  return typeof first?.message === 'string' ? first.message : 'The session reported an unnamed GraphQL error.'
}

const validateEnvelope = <T>(operationName: string, envelope: GraphqlEnvelope | null): T => {
  if (!envelope || typeof envelope !== 'object') {
    return throwTapError('GRAPHQL_FAILED', `The session answered ${operationName} with an unrecognizable response.`)
  }

  const errorMessage = firstErrorMessage(envelope.errors)

  if (errorMessage !== null) {
    return throwTapError('GRAPHQL_FAILED', `The session failed to run ${operationName}: ${errorMessage}`)
  }

  if (!envelope.data || typeof envelope.data !== 'object') {
    return throwTapError('GRAPHQL_FAILED', `The session answered ${operationName} without data.`)
  }

  return envelope.data as T
}

export const querySessionGraphql = async <TResult>(session: LiveSessionState, operation: TapGraphqlOperation<TResult>, timeoutMs: number = DEFAULT_QUERY_TIMEOUT_MS): Promise<TResult> => {
  const { operationName, query, variables } = operation
  const url = `http://${GRAPHQL_HOST}:${session.serverPort}${GRAPHQL_PATH}/${operationName}`

  let response: { status: number, redirected: boolean, json (): Promise<unknown> }

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [SESSION_ID_HEADER]: session.sessionId },
      body: JSON.stringify({ operationName, query, variables: variables ?? {} }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err: any) {
    debug('graphql request %s to pid %d failed: %o', operationName, session.pid, err)

    return throwTapError('GRAPHQL_UNREACHABLE', `Could not reach the session to run ${operationName}: ${err.message}`, err)
  }

  // A valid request passes the server's force-proxy guard untouched; a redirect
  // means the guard sent us to the runner page because the session doesn't allow
  // direct tap GraphQL — an older Cypress that predates it (or one that rejected
  // our session-id). Report that instead of the runner HTML as a data error.
  if (response.redirected) {
    return throwTapError('SESSION_OUTDATED', `The session redirected the ${operationName} request instead of answering it, so it does not support direct tap GraphQL.`)
  }

  if (response.status !== 200) {
    // express-graphql answers parse/validation failures with 400 + { errors: [...] };
    // log it for debugging, but still report unreachable to the user.
    const envelope = await response.json().catch(() => null)

    debug('graphql request %s to pid %d answered %d: %o', operationName, session.pid, response.status, envelope)

    return throwTapError('GRAPHQL_UNREACHABLE', `The session answered ${operationName} with status ${response.status}.`)
  }

  const envelope = await response.json().catch((err) => {
    return throwTapError('GRAPHQL_FAILED', `The session answered ${operationName} with a non-JSON response.`, err)
  })

  return validateEnvelope<TResult>(operationName, envelope as GraphqlEnvelope | null)
}
