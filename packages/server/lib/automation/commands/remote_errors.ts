import type { Protocol } from 'devtools-protocol'
import type { RemoteUncaughtException } from '@packages/types'
import type { SendDebuggerCommand } from '../../browsers/cdp-protocol/cdp_automation'
import { SERIALIZE_ERROR } from './remote_visit'

// bounds the round trip, which waits on the AUT when it's busy or mid-navigation
const FLUSH_ROUND_TRIP_LIMIT_MS = 1000

// AUT errors reach the driver asynchronously, so one thrown before a test's last command
// finished could otherwise arrive after the test ended
export class RemoteErrorReports {
  private inFlight = new Set<Promise<void>>()

  constructor (private evaluateInAut: (expression: string) => Promise<unknown>) {}

  report = (reporting: Promise<void>) => {
    this.inFlight.add(reporting)
    reporting.finally(() => this.inFlight.delete(reporting)).catch(() => {})

    return reporting
  }

  // the browser sends an error's event before its reply to a later evaluate in the same document
  async flush () {
    await Promise.race([
      this.evaluateInAut(`''`).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, FLUSH_ROUND_TRIP_LIMIT_MS)),
    ])

    await Promise.allSettled([...this.inFlight])
  }
}

export const cdpUncaughtException = async (send: SendDebuggerCommand, details: Protocol.Runtime.ExceptionDetails): Promise<RemoteUncaughtException> => {
  const handlerType = details.text.includes('(in promise)') ? 'unhandledrejection' : 'error'
  const { exception } = details

  if (!exception) {
    return { handlerType, error: { message: details.text } }
  }

  if (!exception.objectId) {
    if (exception.type === 'string') {
      return { handlerType, error: { message: exception.value } }
    }

    // worded as the driver words a non-error value it catches in the AUT itself
    const value = exception.unserializableValue ?? (exception.type === 'undefined' ? 'undefined' : JSON.stringify(exception.value))

    return { handlerType, error: { message: `An unknown error has occurred: ${value}` } }
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
