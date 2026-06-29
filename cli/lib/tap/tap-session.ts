import Debug from 'debug'
import CRI from 'chrome-remote-interface'

import type { ReadyRunnerState } from '../runner-discovery'
import { TAP_BINDING_GLOBAL } from './contract'

const debug = Debug('cypress:cli:tap')

type TapTransportErrorCode =
  | 'CDP_UNREACHABLE'
  | 'BINDING_NOT_FOUND'
  | 'BINDING_THREW'
  | 'STALE_HANDLE'
  | 'INVALID_METHOD'
  | 'INVALID_SCHEMA'
  | 'INVALID_EXEC_RESULT'
  | 'UNSUPPORTED_PROTOCOL'

/**
 * A failure on the discovery/CDP/handshake path, distinct from a domain-level
 * result. Follows the `RunnerDiscoveryError` convention: a typed `code`
 * callers can switch on instead of parsing English messages.
 */
export class TapTransportError extends Error {
  code: TapTransportErrorCode

  constructor (code: TapTransportErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TapTransportError'
    this.code = code
  }
}

/**
 * One open CDP session against the runner page. `call` invokes a binding
 * method by name and returns its JSON-decoded result, so the `getSchema`
 * handshake and the command invocation share a single connection.
 */
export interface TapSession {
  call (method: string, args?: unknown[]): Promise<unknown>
}

// Binding method names must be plain identifiers. Callers only pass the
// contract constants (getSchema, exec) today, but `call` is the trampoline
// boundary — nothing else may ever reach the template in callBindingMethod.
const METHOD_NAME_RE = /^[a-zA-Z][a-zA-Z0-9]*$/

// CDP's canonical replies when a navigation discarded the execution context
// holding our binding handle — between acquiring and using it, or while a
// call was in flight (the first cross-origin cy.visit reloads the runner top
// frame mid-run). The target survives and the binding is re-findable by name.
const STALE_OBJECT_RE = /Could not find object with given id|Cannot find context with specified id|Execution context was destroyed/i

const isStaleHandleError = (err: unknown): boolean => {
  // CRI rejects protocol errors as a `ProtocolError` whose message carries the
  // CDP text, so match on the message rather than an error class.
  return err instanceof Error && STALE_OBJECT_RE.test(err.message)
}

// CDP's replies when the attached page SESSION itself died — a cross-process
// navigation (the first cross-origin cy.visit moves the runner top frame to
// the AUT origin) severs the flattened session, so no retry over the same
// sessionId can ever succeed. Recovery is re-attaching to the page.
const SESSION_GONE_RE = /Inspected target navigated or closed|Session with given id not found/i

const isSessionGoneError = (err: unknown): boolean => {
  if (!(err instanceof Error)) {
    return false
  }

  // The call path wraps the CRI rejection in a TapTransportError whose
  // message embeds the CDP text and whose cause is the original error.
  const cause = (err as { cause?: unknown }).cause

  return SESSION_GONE_RE.test(err.message) || (cause instanceof Error && SESSION_GONE_RE.test(cause.message))
}

// Structural subset of CDP `Target.TargetInfo` — enough to enumerate candidate
// pages without coupling to the full `devtools-protocol` type surface.
interface PageTargetInfo {
  targetId: string
  type: string
  url: string
}

// Passing a `ws://` URL makes CRI connect straight to it with no HTTP /json
// call — so discovery → connection is entirely over the wire.
const connectToBrowser = async (wsUrl: string): Promise<CRI.Client> => {
  try {
    return await CRI({ target: wsUrl })
  } catch (err: any) {
    throw new TapTransportError(
      'CDP_UNREACHABLE',
      'Could not open a debugging connection to the browser. It may have just closed; check Cypress and try again.',
      { cause: err },
    )
  }
}

const listTargets = async (client: CRI.Client) => {
  try {
    return await client.Target.getTargets()
  } catch (err: any) {
    throw new TapTransportError('CDP_UNREACHABLE', `Connected to the browser, but listing its targets failed: ${err.message}`, { cause: err })
  }
}

const attachToPage = async (client: CRI.Client, targetId: string): Promise<string> => {
  try {
    // `flatten` multiplexes the page session over the existing browser
    // connection — subsequent commands carry the returned sessionId.
    const { sessionId } = await client.Target.attachToTarget({ targetId, flatten: true })

    return sessionId
  } catch (err: any) {
    throw new TapTransportError(
      'CDP_UNREACHABLE',
      'Could not attach to the Cypress runner page. The browser may have just closed; check Cypress and try again.',
      { cause: err },
    )
  }
}

// True when the page behind `sessionId` has the tap binding mounted. Any
// evaluation hiccup (mid-navigation, page closing) just means "not this one".
const probeForBinding = async (client: CRI.Client, sessionId: string): Promise<boolean> => {
  // A constant expression — nothing is ever interpolated or escaped.
  const { result, exceptionDetails } = await client.Runtime.evaluate({
    expression: `window.${TAP_BINDING_GLOBAL}`,
  }, sessionId)

  return !exceptionDetails && result.type !== 'undefined' && !!result.objectId
}

// The runner page is found by probing every page target for the binding
// global, not by URL: the first cross-origin cy.visit of a test re-serves the
// runner under the AUT's origin (the proxy answers /__/ on any origin), so any
// origin recorded at discovery time goes stale after the first run.
const findRunnerPageSession = async (client: CRI.Client, targetInfos: PageTargetInfo[]): Promise<string> => {
  for (const target of targetInfos) {
    if (target.type !== 'page') {
      continue
    }

    try {
      const sessionId = await attachToPage(client, target.targetId)

      if (await probeForBinding(client, sessionId)) {
        debug('matched runner page target %o', { targetId: target.targetId, url: target.url })

        return sessionId
      }

      // Not the runner — drop the session rather than holding one open on an
      // unrelated page for the rest of the command.
      await client.Target.detachFromTarget({ sessionId }).catch(() => {})
    } catch (err: any) {
      // A candidate page can close or navigate mid-probe; keep looking.
      debug('probing target %s failed: %s', target.targetId, err.message)
    }
  }

  throw new TapTransportError(
    'BINDING_NOT_FOUND',
    'Failed to connect to Cypress. The runner may still be loading (try again), the runner tab may have been closed, or the running Cypress version may not support `cypress tap`.',
  )
}

const resolveBindingObjectId = async (client: CRI.Client, sessionId: string): Promise<string> => {
  // A constant expression — nothing is ever interpolated or escaped.
  const { result, exceptionDetails } = await client.Runtime.evaluate({
    expression: `window.${TAP_BINDING_GLOBAL}`,
  }, sessionId)

  if (exceptionDetails) {
    throw new TapTransportError('CDP_UNREACHABLE', `Evaluating window.${TAP_BINDING_GLOBAL} failed: ${exceptionDetails.text}`)
  }

  if (result.type === 'undefined' || !result.objectId) {
    throw new TapTransportError(
      'BINDING_NOT_FOUND',
      'Failed to connect to Cypress. The running Cypress version may not support `cypress tap`, or the runner is still loading — try again.',
    )
  }

  return result.objectId
}

const callBindingMethod = (client: CRI.Client, sessionId: string, objectId: string, method: string, args: unknown[]) => {
  // The trampoline interpolates only a METHOD_NAME_RE-validated identifier
  // (enforced in withTapSession's `call`), and `callFunctionOn` executes a
  // function object (not a source string), so page CSP cannot block it.
  // `arguments` + `returnByValue` + `awaitPromise` are the JSON wire boundary —
  // CDP (de)serializes both directions.
  return client.Runtime.callFunctionOn({
    objectId,
    functionDeclaration: `function (...a) { return this.${method}(...a) }`,
    arguments: args.map((value) => ({ value })),
    returnByValue: true,
    awaitPromise: true,
  }, sessionId)
}

const callBindingWithRetry = async (client: CRI.Client, sessionId: string, method: string, args: unknown[]) => {
  const objectId = await resolveBindingObjectId(client, sessionId)

  try {
    return await callBindingMethod(client, sessionId, objectId, method, args)
  } catch (err: any) {
    if (!isStaleHandleError(err)) {
      throw new TapTransportError('CDP_UNREACHABLE', `The CDP call for ${method} failed: ${err.message}`, { cause: err })
    }

    // A navigation invalidated the handle between acquiring and using it.
    // The binding is re-findable by name, so re-acquire and retry once.
    debug('stale binding handle; re-acquiring and retrying once')

    const freshObjectId = await resolveBindingObjectId(client, sessionId)

    try {
      return await callBindingMethod(client, sessionId, freshObjectId, method, args)
    } catch (retryErr: any) {
      if (isStaleHandleError(retryErr)) {
        throw new TapTransportError('STALE_HANDLE', 'The Cypress runner navigated while handling the command. Try again.', { cause: retryErr })
      }

      throw new TapTransportError('CDP_UNREACHABLE', `The CDP call for ${method} failed: ${retryErr.message}`, { cause: retryErr })
    }
  }
}

/**
 * Open one tap session end-to-end against an already-resolved runner and hand
 * it to `fn`: open a CDP connection to the runner's browser endpoint, attach a
 * flattened session to the runner page (found by probing page targets for the
 * binding global), then let `fn` invoke binding methods by name via
 * `session.call`. The schema-driven dispatch in `../exec/tap` uses one session
 * for both the `getSchema` handshake and the command invocation.
 *
 * Which runner to target is decided up front by `resolveRunner` (so the caller
 * can also report it in help); this only opens the session. Transport failures
 * throw `TapTransportError` and are never folded into domain results. A throw
 * from the binding itself is a binding bug and surfaces as `BINDING_THREW`.
 */
export const withTapSession = async <T> (
  runner: ReadyRunnerState,
  fn: (session: TapSession) => Promise<T>,
): Promise<T> => {
  debug('opening tap session for runner %o', { pid: runner.pid, cdpBrowserWsUrl: runner.cdpBrowserWsUrl })

  const client = await connectToBrowser(runner.cdpBrowserWsUrl)

  try {
    const attach = async (): Promise<string> => {
      const { targetInfos } = await listTargets(client)

      return findRunnerPageSession(client, targetInfos)
    }

    let sessionId = await attach()

    const call = async (method: string, args: unknown[] = []): Promise<unknown> => {
      if (!METHOD_NAME_RE.test(method)) {
        throw new TapTransportError('INVALID_METHOD', `"${method}" is not a valid tap binding method name.`)
      }

      let response

      try {
        response = await callBindingWithRetry(client, sessionId, method, args)
      } catch (err: any) {
        if (!isSessionGoneError(err)) {
          throw err
        }

        // A cross-process navigation severed the session — the page target
        // survives, so re-attach and retry once. Re-attaching throws
        // BINDING_NOT_FOUND while the reloaded runner is still mounting,
        // which long-polling callers treat as retryable.
        debug('session gone (%s); re-attaching to the runner page', err.message)

        sessionId = await attach()

        response = await callBindingWithRetry(client, sessionId, method, args)
      }

      if (response.exceptionDetails) {
        // Binding methods return domain failures as values; a throw is a binding
        // bug and is surfaced as a transport failure, never a domain result.
        throw new TapTransportError(
          'BINDING_THREW',
          `window.${TAP_BINDING_GLOBAL}.${method} threw: ${response.exceptionDetails.exception?.description || response.exceptionDetails.text}`,
        )
      }

      // returnByValue means result.value is already the JSON-decoded domain value.
      return response.result.value
    }

    return await fn({ call })
  } finally {
    // close() can reject if the socket already died; the command result stands.
    await client.close().catch(() => {})
  }
}
