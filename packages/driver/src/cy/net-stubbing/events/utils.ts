import { find } from 'lodash'
import type { CyHttpMessages } from '@packages/net-stubbing/lib/types'

export function hasJsonContentType (headers: { [k: string]: string | string[] }) {
  const contentType = find(headers, (v, k) => /^content-type$/i.test(k))

  if (Array.isArray(contentType)) {
    return false
  }

  return contentType && /^application\/.*json/i.test(contentType)
}

export function parseJsonBody (message: CyHttpMessages.BaseMessage): boolean {
  if (!hasJsonContentType(message.headers)) {
    return false
  }

  try {
    message.body = JSON.parse(message.body)

    return true
  } catch (e) {
    // invalid JSON
  }

  return false
}

export function stringifyJsonBody (message: CyHttpMessages.BaseMessage) {
  message.body = JSON.stringify(message.body)
}
