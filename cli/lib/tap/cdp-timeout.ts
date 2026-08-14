import type CRI from 'chrome-remote-interface'

import { CypressInstanceError } from '../cypress-instances'

/** Bound for a protocol call, including one awaiting app-side work. */
export const DEFAULT_CDP_TIMEOUT_MS = 30_000

/**
 * Bound for the calls that locate the runner page. A healthy renderer answers
 * these in milliseconds, so keeping them short is what lets the scan skip an
 * unresponsive target rather than stop on it.
 */
export const FIND_INSTANCE_TIMEOUT_MS = 2_000

const unresponsive = (what: string, ms: number): CypressInstanceError => {
  return new CypressInstanceError(
    'RENDERER_UNRESPONSIVE',
    `The targeted Cypress instance did not answer ${what} within ${ms}ms. The browser is reachable, but the page running Cypress is not responding — it may be paused in devtools, stuck in a loop, or starved of memory. Pass --timeout <ms> to wait longer.`,
  )
}

export const isRendererUnresponsive = (err: unknown): boolean => {
  return err instanceof CypressInstanceError && err.code === 'RENDERER_UNRESPONSIVE'
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
