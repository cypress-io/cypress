import Debug from 'debug'

import { errors } from '../errors'
import { throwTapError } from './tap-session'
import type { LiveInstanceState } from '../cypress-instances'
import { INSTANCE_ID_HEADER } from '@packages/cypress-instances'
import type { TapGraphqlOperation } from '@packages/cypress-instances'

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

export const queryInstanceGraphql = async <TResult>(instance: LiveInstanceState, operation: TapGraphqlOperation<TResult>, timeoutMs: number = DEFAULT_QUERY_TIMEOUT_MS): Promise<TResult> => {
  const { operationName, query, variables } = operation
  const url = `http://${GRAPHQL_HOST}:${instance.serverPort}${GRAPHQL_PATH}/${operationName}`

  let response: { status: number, json (): Promise<unknown> }

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [INSTANCE_ID_HEADER]: instance.instanceId },
      body: JSON.stringify({ operationName, query, variables: variables ?? {} }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err: any) {
    debug('graphql request %s to pid %d failed: %o', operationName, instance.pid, err)

    return throwTapError(errors.tapGraphqlUnreachable, `Could not reach the instance to run ${operationName}: ${err.message}`, err)
  }

  if (response.status !== 200) {
    // A non-200 can still carry a GraphQL error envelope — express-graphql answers
    // parse/validation failures (e.g. schema skew) with 400 + { errors: [...] }.
    // Surface that message rather than a misleading "unreachable".
    const envelope = await response.json().catch(() => null) as GraphqlEnvelope | null
    const errorMessage = envelope ? firstErrorMessage(envelope.errors) : null

    if (errorMessage !== null) {
      return throwTapError(errors.tapGraphqlFailed, `The instance failed to run ${operationName}: ${errorMessage}`)
    }

    return throwTapError(errors.tapGraphqlUnreachable, `The instance answered ${operationName} with status ${response.status}.`)
  }

  const envelope = await response.json().catch((err) => {
    return throwTapError(errors.tapGraphqlFailed, `The instance answered ${operationName} with a non-JSON response.`, err)
  })

  return validateEnvelope<TResult>(operationName, envelope as GraphqlEnvelope | null)
}
