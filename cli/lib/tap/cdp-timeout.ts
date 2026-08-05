import type CRI from 'chrome-remote-interface'

import { CypressInstanceError } from '../cypress-instances'

/** Per-call bound for CDP work that waits on the page under test. */
export const DEFAULT_CDP_TIMEOUT_MS = 30_000

/**
 * Bound for the calls that locate the runner page. A healthy renderer answers
 * these in milliseconds, so keeping them short is what lets the scan skip an
 * unresponsive target rather than stop on it.
 */
export const FIND_INSTANCE_TIMEOUT_MS = 2_000

export interface CdpBounds {
  /** Bound for a protocol call, including one awaiting app-side work. */
  call: number
  /** Bound for locating the runner page. */
  findInstance: number
}

/**
 * The two default bounds differ by an order of magnitude because the waits do:
 * finding the runner page is a round trip, while calling into it can legitimately
 * wait on a spec. `--timeout` is the one knob for "this is slow, wait longer", so
 * it raises both rather than leaving the shorter one to fail underneath it.
 */
export const cdpBounds = (timeoutMs?: number): CdpBounds => {
  return {
    call: timeoutMs ?? DEFAULT_CDP_TIMEOUT_MS,
    findInstance: timeoutMs ?? FIND_INSTANCE_TIMEOUT_MS,
  }
}

const unresponsive = (what: string, ms: number): CypressInstanceError => {
  return new CypressInstanceError(
    'RENDERER_UNRESPONSIVE',
    `Cypress did not answer ${what} within ${ms}ms. The browser is reachable, but the page running Cypress is not responding — it may be paused in devtools, stuck in a loop, or starved of memory. Pass --timeout <ms> to wait longer.`,
  )
}

const isThenable = (value: unknown): value is Promise<unknown> => {
  return !!value && typeof (value as { then?: unknown }).then === 'function'
}

export const isRendererUnresponsive = (err: unknown): boolean => {
  return err instanceof CypressInstanceError && err.code === 'RENDERER_UNRESPONSIVE'
}

/**
 * A pending CDP reply has no timer of its own, and the only thing that settles
 * one other than a matching reply is the browser-level socket closing — so a
 * target that stops answering leaves the promise orphaned forever. Stop waiting
 * on our side; the orphan settles when the session closes its client.
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

const isProtocolName = (prop: string | symbol): prop is string => {
  return typeof prop === 'string' && /^[A-Z]/.test(prop)
}

export const boundCdpClient = (client: CRI.Client, ms: number): CRI.Client => {
  const bind = (fn: (...args: unknown[]) => unknown, owner: object, what: string) => {
    return (...args: unknown[]) => {
      const result = fn.apply(owner, args)

      return isThenable(result) ? withCdpDeadline(result, what, ms) : result
    }
  }

  const domains = new Map<string, unknown>()

  return new Proxy(client, {
    get (target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      if (!isProtocolName(prop)) {
        return value
      }

      // The client carries each command as a flat `Domain.method` key too.
      if (typeof value === 'function') {
        return bind(value as (...args: unknown[]) => unknown, target, prop)
      }

      if (typeof value !== 'object' || value === null) {
        return value
      }

      const cached = domains.get(prop)

      if (cached) {
        return cached
      }

      const domain = new Proxy(value, {
        get (domainTarget, method, domainReceiver) {
          const fn = Reflect.get(domainTarget, method, domainReceiver)

          if (typeof fn !== 'function' || typeof method !== 'string') {
            return fn
          }

          return bind(fn as (...args: unknown[]) => unknown, domainTarget, `${prop}.${method}`)
        },
      })

      domains.set(prop, domain)

      return domain
    },
  }) as CRI.Client
}
