import _ from 'lodash'
import type { CyHttpMessages } from '../types/external-types'
import { SERIALIZABLE_REQ_PROPS } from '../types/internal-types'

export function mergeDeletedHeaders (before: CyHttpMessages.BaseMessage, after: CyHttpMessages.BaseMessage) {
  for (const k in before.headers) {
    !after.headers[k] && delete before.headers[k]
  }
}

export function mergeWithPreservedBuffers (before: CyHttpMessages.BaseMessage, after: Partial<CyHttpMessages.BaseMessage>) {
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
  before: CyHttpMessages.IncomingRequest,
  after: CyHttpMessages.IncomingRequest,
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
