import Debug from 'debug'

import { errors } from '../errors'
import { throwTapError } from './tap-connection'
import type { LiveSessionState } from '../cypress-sessions'
import { verifySessionRecord } from '../cypress-sessions'
import { SESSION_ID_HEADER, LEGACY_TAP_GRAPHQL_PATH, tapGraphqlPath } from '@packages/cypress-sessions'
import type { TapGraphqlOperation } from '@packages/cypress-sessions'

const debug = Debug('cypress:cli:tap')

const GRAPHQL_HOST = '127.0.0.1'
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

// Whether the session served this path at all. The force-proxy guard redirects an
// unrecognized path to the runner page while the MITM proxy is on, and Express 404s
// it when CDP owns browser traffic instead; graphql itself answers 400 or 500, so
// neither of these comes from the query.
const isUnservedPath = (response: { status: number, redirected: boolean }): boolean => {
  return response.redirected || response.status === 404
}

// A session serving neither path is the reason for the failure, so the fault lies with
// it rather than the request. Its liveness probe tells the two apart: the route is
// unnamespaced and present in every build that has tap, so an answer means a live
// session that simply predates the tap route, and silence means it is gone.
const throwForUnservedPaths = async (session: LiveSessionState, operationName: string): Promise<never> => {
  const live = await verifySessionRecord(session)

  if (live === null) {
    return throwTapError('STALE_SESSION', `The session stopped answering while running ${operationName}.`)
  }

  return throwTapError('SESSION_OUTDATED', `The session does not serve ${operationName} over tap GraphQL.`)
}

export const querySessionGraphql = async <TResult>(session: LiveSessionState, operation: TapGraphqlOperation<TResult>, timeoutMs: number = DEFAULT_QUERY_TIMEOUT_MS): Promise<TResult> => {
  const { operationName, query, variables } = operation

  const post = (path: string) => {
    return fetch(`http://${GRAPHQL_HOST}:${session.serverPort}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [SESSION_ID_HEADER]: session.sessionId },
      body: JSON.stringify({ operationName, query, variables: variables ?? {} }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  }

  let response: { status: number, redirected: boolean, json (): Promise<unknown> }

  try {
    response = await post(tapGraphqlPath(operationName))

    // Sessions that predate the fixed tap route only serve GraphQL under the project's
    // `namespace`, so retry the default one — every such session that did not override
    // it answers there.
    if (isUnservedPath(response)) {
      debug('graphql request %s to pid %d went unserved; retrying the legacy path', operationName, session.pid)

      response = await post(`${LEGACY_TAP_GRAPHQL_PATH}/${operationName}`)
    }
  } catch (err: any) {
    debug('graphql request %s to pid %d failed: %o', operationName, session.pid, err)

    return throwTapError('GRAPHQL_UNREACHABLE', `Could not reach the session to run ${operationName}: ${err.message}`, err)
  }

  if (isUnservedPath(response)) {
    return await throwForUnservedPaths(session, operationName)
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
