import { find } from 'lodash'
import { CyHttpMessages } from '@packages/net-stubbing/lib/types'

export function hasJsonContentType (headers: { [k: string]: string }) {
  const contentType = find(headers, (v, k) => /^content-type$/i.test(k))

  return contentType && /^application\/json/i.test(contentType)
}

export function parseJsonBody (message: CyHttpMessages.BaseMessage) {
  if (!hasJsonContentType(message.headers)) {
    return
  }

  try {
    message.body = JSON.parse(message.body)
  } catch (e) {
    // invalid JSON
  }
}
