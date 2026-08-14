import type CRI from 'chrome-remote-interface'

import { isTapError, TapError } from '../cypress-sessions'

/** Bound for a protocol call, including one awaiting app-side work. */
export const DEFAULT_CDP_TIMEOUT_MS = 30_000

/**
 * Bound for the calls that locate the runner page. A healthy renderer answers
 * these in milliseconds, so keeping them short is what lets the scan skip an
 * unresponsive target rather than stop on it.
 */
export const FIND_SESSION_TIMEOUT_MS = 2_000

// Which call went unanswered is a protocol detail, so it stays on the diagnostic;
// how long we waited is the part the user can act on with `--timeout`.
const unresponsive = (what: string, ms: number): TapError => {
  return new TapError('RENDERER_UNRESPONSIVE', {
    detail: `No response within the specified timeout (${ms}ms).`,
    message: `No reply to ${what} within ${ms}ms.`,
  })
}

export const isRendererUnresponsive = (err: unknown): boolean => {
  return isTapError(err) && err.code === 'RENDERER_UNRESPONSIVE'
}

/**
 * A pending CDP reply has no timer of its own, and the only thing that settles
 * one other than a matching reply is the browser-level socket closing — so a
 * target that stops answering leaves the promise orphaned forever. Stop waiting
 * on our side; the orphan settles when the connection closes its client.
 */
export const withCdpDeadline = async <T> (work: Promise<T>, what: string, ms: number): Promise<T> => {
  let timer: NodeJS.Timeout | undefined

  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(unresponsive(what, ms)), ms)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Every domain shorthand (`client.Runtime.evaluate(...)`) is generated as a call
 * to `client.send`, so replacing that one method bounds every protocol call the
 * connection makes, including the raw-client ones the frame extractors issue. Event
 * subscriptions and `close` don't go through it and stay unbounded.
 */
export const boundCdpCalls = (client: CRI.Client, ms: number): void => {
  const send = client.send.bind(client) as (...args: unknown[]) => Promise<unknown>

  client.send = ((method: string, ...rest: unknown[]) => {
    return withCdpDeadline(send(method, ...rest), method, ms)
  }) as CRI.Client['send']
}
