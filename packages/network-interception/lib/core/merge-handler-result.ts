import _ from 'lodash'
import type { InterceptWireBaseMessage, InterceptWireRequest, InterceptWireResponse } from '../types/intercept-wire'
import { SERIALIZABLE_REQ_PROPS } from '../types/internal-types'

export function mergeDeletedHeaders (before: InterceptWireBaseMessage, after: InterceptWireBaseMessage) {
  for (const k in before.headers) {
    // a header was deleted from `after` but was present in `before`, delete it in `before` too.
    // only treat `undefined` (deleted via `delete` or explicitly set to `undefined`) as removal -
    // an empty string is a valid header value and must be preserved (#25767)
    after.headers[k] === undefined && delete before.headers[k]
  }
}

export function mergeWithPreservedBuffers (before: InterceptWireBaseMessage, after: Partial<InterceptWireBaseMessage>) {
  _.mergeWith(before, after, (_a, b) => {
    if (b instanceof Buffer) {
      return b
    }

    return undefined
  })
}

export type MergeIncomingRequestChangesOptions = {
  baseUrl: string
  resolveUrl: (baseUrl: string, relativeUrl: string) => string
}

/**
 * Apply driver handler changes from `after` onto `before` for a `before:request` round-trip.
 * Returns the resolved request URL.
 */
export function mergeIncomingRequestChanges (
  before: InterceptWireRequest,
  after: InterceptWireRequest,
  options: MergeIncomingRequestChangesOptions,
): string {
  if ('content-length' in before.headers && before.headers['content-length'] === after.headers['content-length']) {
    after.headers['content-length'] = String(Buffer.from(after.body).byteLength)
  }

  const resolvedUrl = options.resolveUrl(options.baseUrl, after.url)

  after.url = resolvedUrl

  mergeWithPreservedBuffers(before, _.pick(after, SERIALIZABLE_REQ_PROPS))

  mergeDeletedHeaders(before, after)

  return resolvedUrl
}

export type MergeIncomingResponseChangesOptions = {
  serializableProps: readonly string[]
}

/**
 * Apply driver handler changes from `after` onto `before` for response round-trips.
 */
export function mergeIncomingResponseChanges (
  before: InterceptWireResponse,
  after: InterceptWireResponse,
  options: MergeIncomingResponseChangesOptions,
): void {
  mergeWithPreservedBuffers(before, _.pick(after, options.serializableProps) as Partial<InterceptWireResponse>)

  mergeDeletedHeaders(before, after)
}
