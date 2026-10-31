import type { Protocol } from 'devtools-protocol'
import type { RemoteUncaughtException } from '@packages/types'
import type { SendDebuggerCommand } from '../../browsers/cdp-protocol/cdp_automation'
import { SERIALIZE_ERROR } from './remote_visit'

const UNHANDLED_REJECTION_PREFIXES = [
  // WebKit
  'Unhandled Promise Rejection: ',
  // Firefox
  'uncaught exception: ',
]

// Splits the "Name: message" text that WebKit and BiDi report for an uncaught error
export const parseUncaughtErrorText = (text: string, stack: string | undefined, rejection: boolean): RemoteUncaughtException => {
  let handlerType: RemoteUncaughtException['handlerType'] = rejection ? 'unhandledrejection' : 'error'

  for (const prefix of UNHANDLED_REJECTION_PREFIXES) {
    if (text.startsWith(prefix)) {
      text = text.slice(prefix.length)
      handlerType = 'unhandledrejection'
    }
  }

  const match = /^([\w$]*(?:Error|Exception)): ([\s\S]*)$/.exec(text)

  if (match) {
    return { handlerType, error: { name: match[1], message: match[2], stack } }
  }

  return { handlerType, error: { message: text, stack } }
}

export const cdpUncaughtException = async (send: SendDebuggerCommand, details: Protocol.Runtime.ExceptionDetails): Promise<RemoteUncaughtException> => {
  const handlerType = details.text.includes('(in promise)') ? 'unhandledrejection' : 'error'
  const { exception } = details

  if (!exception?.objectId) {
    return { handlerType, error: { message: String(exception?.value ?? exception?.description ?? details.text) } }
  }

  try {
    const { result } = await send('Runtime.callFunctionOn', {
      objectId: exception.objectId,
      functionDeclaration: `function () { return (${SERIALIZE_ERROR})(this) }`,
      returnByValue: true,
    })

    return { handlerType, error: result.value }
  } finally {
    await send('Runtime.releaseObject', { objectId: exception.objectId }).catch(() => {})
  }
}
