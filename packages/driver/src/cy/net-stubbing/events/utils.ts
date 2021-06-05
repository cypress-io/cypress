import { find } from 'lodash'
import { CyHttpMessages } from '@packages/net-stubbing/lib/types'
import { deepCopyArrayBuffer, setArrayBufferPrototype } from '../utils'

export function hasJsonContentType (headers: { [k: string]: string }) {
  const contentType = find(headers, (v, k) => /^content-type$/i.test(k))

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

export function mergeWithArrayBuffer (before: CyHttpMessages.BaseMessage, after: Partial<CyHttpMessages.BaseMessage>) {
  _.mergeWith(before, after, (_a, b) => {
    if (_.isArrayBuffer(b)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const copiedBuffer = deepCopyArrayBuffer(b)

      // return copiedBuffer
      setArrayBufferPrototype(b)

      return b
    }

    return undefined
  })
}
