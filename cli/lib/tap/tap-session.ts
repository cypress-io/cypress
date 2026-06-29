import Debug from 'debug'
import CRI from 'chrome-remote-interface'

import type { ReadyRunnerState } from '../runner-instances'
import { TAP_BINDING_GLOBAL } from './contract'

const debug = Debug('cypress:cli:tap')

type TapTransportErrorCode =
  | 'CDP_UNREACHABLE'
  | 'BINDING_NOT_FOUND'
  | 'BINDING_THREW'
  | 'STALE_HANDLE'
  | 'INVALID_METHOD'

export class TapTransportError extends Error {
  code: TapTransportErrorCode

  constructor (code: TapTransportErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TapTransportError'
    this.code = code
  }
}

export interface TapSession {
  call (method: string, args?: unknown[]): Promise<unknown>
}

const METHOD_NAME_RE = /^[a-zA-Z][a-zA-Z0-9]*$/

const STALE_OBJECT_RE = /Could not find object with given id|Cannot find context with specified id|Execution context was destroyed/i

const isStaleHandleError = (err: unknown): boolean => {
  return err instanceof Error && STALE_OBJECT_RE.test(err.message)
}

const SESSION_GONE_RE = /Inspected target navigated or closed|Session with given id not found/i

const isSessionGoneError = (err: unknown): boolean => {
  if (!(err instanceof Error)) {
    return false
  }

  const cause = (err as { cause?: unknown }).cause

  return SESSION_GONE_RE.test(err.message) || (cause instanceof Error && SESSION_GONE_RE.test(cause.message))
}

interface PageTargetInfo {
  targetId: string
  type: string
  url: string
}

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

const evaluateBinding = (client: CRI.Client, sessionId: string) => {
  return client.Runtime.evaluate({ expression: `window.${TAP_BINDING_GLOBAL}` }, sessionId)
}

const probeForBinding = async (client: CRI.Client, sessionId: string): Promise<boolean> => {
  const { result, exceptionDetails } = await evaluateBinding(client, sessionId)

  return !exceptionDetails && result.type !== 'undefined' && !!result.objectId
}

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

      await client.Target.detachFromTarget({ sessionId }).catch(() => {})
    } catch (err: any) {
      debug('probing target %s failed: %s', target.targetId, err.message)
    }
  }

  throw new TapTransportError(
    'BINDING_NOT_FOUND',
    'Failed to connect to Cypress. The runner may still be loading (try again), the runner tab may have been closed, or the running Cypress version may not support `cypress tap`.',
  )
}

const resolveBindingObjectId = async (client: CRI.Client, sessionId: string): Promise<string> => {
  const { result, exceptionDetails } = await evaluateBinding(client, sessionId)

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
  return client.Runtime.callFunctionOn({
    objectId,
    functionDeclaration: `function (...a) { return this.${method}(...a) }`,
    arguments: args.map((value) => ({ value })),
    returnByValue: true,
    awaitPromise: true,
  }, sessionId)
}

const throwCdpError = (method: string, err: any): never => {
  throw new TapTransportError('CDP_UNREACHABLE', `The CDP call for ${method} failed: ${err.message}`, { cause: err })
}

const callBindingWithRetry = async (client: CRI.Client, sessionId: string, method: string, args: unknown[]) => {
  const objectId = await resolveBindingObjectId(client, sessionId)

  try {
    return await callBindingMethod(client, sessionId, objectId, method, args)
  } catch (err: any) {
    if (!isStaleHandleError(err)) {
      throwCdpError(method, err)
    }

    debug('stale binding handle; re-acquiring and retrying once')

    const freshObjectId = await resolveBindingObjectId(client, sessionId)

    try {
      return await callBindingMethod(client, sessionId, freshObjectId, method, args)
    } catch (retryErr: any) {
      if (isStaleHandleError(retryErr)) {
        throw new TapTransportError('STALE_HANDLE', 'The Cypress runner navigated while handling the command. Try again.', { cause: retryErr })
      }

      throwCdpError(method, retryErr)
    }
  }
}

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

        debug('session gone (%s); re-attaching to the runner page', err.message)

        sessionId = await attach()

        response = await callBindingWithRetry(client, sessionId, method, args)
      }

      if (response.exceptionDetails) {
        throw new TapTransportError(
          'BINDING_THREW',
          `window.${TAP_BINDING_GLOBAL}.${method} threw: ${response.exceptionDetails.exception?.description || response.exceptionDetails.text}`,
        )
      }

      return response.result.value
    }

    return await fn({ call })
  } finally {
    await client.close().catch(() => {})
  }
}
