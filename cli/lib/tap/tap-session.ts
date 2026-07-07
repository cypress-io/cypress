import Debug from 'debug'
import CRI from 'chrome-remote-interface'

import { errors } from '../errors'
import type { ReadyInstanceState } from '../cypress-instances'
import { TAP_BINDING_GLOBAL } from '@packages/cypress-instances'

const debug = Debug('cypress:cli:tap')

// Chrome reports these CDP failures under the generic -32000 "server error"
// protocol code, so the exact message text is the only way to recognize them.
export const CdpErrorMessage = {
  objectNotFound: 'Could not find object with given id',
  contextNotFound: 'Cannot find context with specified id',
  contextDestroyed: 'Execution context was destroyed',
  targetGone: 'Inspected target navigated or closed',
  sessionNotFound: 'Session with given id not found',
} as const

const staleObjectMessages = [CdpErrorMessage.objectNotFound, CdpErrorMessage.contextNotFound, CdpErrorMessage.contextDestroyed]
const sessionGoneMessages = [CdpErrorMessage.targetGone, CdpErrorMessage.sessionNotFound]

const matchesAnyMessage = (err: unknown, messages: string[]): boolean => {
  return err instanceof Error && messages.some((message) => err.message.includes(message))
}

export const throwTapError = (details: { description: string, solution: string }, message: string, cause?: unknown): never => {
  const err: any = new Error(message, cause === undefined ? undefined : { cause })

  err.details = details
  err.known = true
  throw err
}

export interface TapSession {
  call (method: string, args?: unknown[]): Promise<unknown>
}

const isStaleHandleError = (err: unknown): boolean => {
  return matchesAnyMessage(err, staleObjectMessages)
}

const isSessionGoneError = (err: unknown): boolean => {
  if (!(err instanceof Error)) {
    return false
  }

  return matchesAnyMessage(err, sessionGoneMessages) || matchesAnyMessage((err as { cause?: unknown }).cause, sessionGoneMessages)
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
    return throwTapError(errors.tapCdpUnreachable, `Could not open a debugging connection to the browser: ${err.message}`, err)
  }
}

const listTargets = async (client: CRI.Client) => {
  try {
    return await client.Target.getTargets()
  } catch (err: any) {
    return throwTapError(errors.tapCdpUnreachable, `Listing the browser's targets failed: ${err.message}`, err)
  }
}

const attachToPage = async (client: CRI.Client, targetId: string): Promise<string> => {
  try {
    const { sessionId } = await client.Target.attachToTarget({ targetId, flatten: true })

    return sessionId
  } catch (err: any) {
    return throwTapError(errors.tapCdpUnreachable, `Could not attach to the Cypress runner page: ${err.message}`, err)
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

    let sessionId: string | undefined

    try {
      sessionId = await attachToPage(client, target.targetId)

      if (await probeForBinding(client, sessionId)) {
        debug('matched runner page target %o', { targetId: target.targetId, url: target.url })

        return sessionId
      }
    } catch (err: any) {
      debug('probing target %s failed: %s', target.targetId, err.message)
    }

    if (sessionId) {
      await client.Target.detachFromTarget({ sessionId }).catch(() => {})
    }
  }

  return throwTapError(errors.tapBindingNotFound, `Failed to connect to the runner page.`)
}

const resolveBindingObjectId = async (client: CRI.Client, sessionId: string): Promise<string> => {
  let evaluated: Awaited<ReturnType<typeof evaluateBinding>>

  try {
    evaluated = await evaluateBinding(client, sessionId)
  } catch (err: any) {
    if (isStaleHandleError(err) || isSessionGoneError(err)) {
      throw err
    }

    return throwTapError(errors.tapCdpUnreachable, `Evaluating the tap binding failed: ${err.message}`, err)
  }

  const { result, exceptionDetails } = evaluated

  if (exceptionDetails) {
    return throwTapError(errors.tapCdpUnreachable, `Failed to connect to the instance.`)
  }

  if (result.type === 'undefined' || !result.objectId) {
    return throwTapError(errors.tapBindingNotFound, `Connected to an unsupported instance.`)
  }

  return result.objectId
}

const callBindingMethod = (client: CRI.Client, sessionId: string, objectId: string, method: string, args: unknown[]) => {
  return client.Runtime.callFunctionOn({
    objectId,
    functionDeclaration: `function (method, ...args) { return this[method](...args) }`,
    arguments: [method, ...args].map((value) => ({ value })),
    returnByValue: true,
    awaitPromise: true,
  }, sessionId)
}

const throwCdpError = (method: string, err: any): never => {
  return throwTapError(errors.tapCdpUnreachable, `The CDP call for ${method} failed: ${err.message}`, err)
}

const callBindingWithRetry = async (client: CRI.Client, sessionId: string, method: string, args: unknown[]) => {
  const attempt = async () => {
    const objectId = await resolveBindingObjectId(client, sessionId)

    try {
      return await callBindingMethod(client, sessionId, objectId, method, args)
    } catch (err: any) {
      if (isStaleHandleError(err)) {
        throw err
      }

      return throwCdpError(method, err)
    }
  }

  try {
    return await attempt()
  } catch (err: any) {
    if (!isStaleHandleError(err)) {
      throw err
    }

    debug('stale binding handle; re-acquiring and retrying once')

    try {
      return await attempt()
    } catch (retryErr: any) {
      if (isStaleHandleError(retryErr)) {
        return throwTapError(errors.tapStaleHandle, retryErr.message, retryErr)
      }

      throw retryErr
    }
  }
}

export const withTapSession = async <T> (
  instance: ReadyInstanceState,
  fn: (session: TapSession) => Promise<T>,
): Promise<T> => {
  debug('opening tap session for instance %o', { pid: instance.pid, cdpBrowserWsUrl: instance.cdpBrowserWsUrl })

  const client = await connectToBrowser(instance.cdpBrowserWsUrl)

  try {
    const attach = async (): Promise<string> => {
      const { targetInfos } = await listTargets(client)

      return findRunnerPageSession(client, targetInfos)
    }

    let sessionId = await attach()

    const call = async (method: string, args: unknown[] = []): Promise<unknown> => {
      let response: Awaited<ReturnType<typeof callBindingWithRetry>>

      try {
        response = await callBindingWithRetry(client, sessionId, method, args)
      } catch (err: any) {
        if (!isSessionGoneError(err)) {
          throw err
        }

        debug('session gone (%s); re-attaching to the runner page', err.message)

        sessionId = await attach()

        try {
          response = await callBindingWithRetry(client, sessionId, method, args)
        } catch (retryErr: any) {
          if (isSessionGoneError(retryErr)) {
            return throwTapError(errors.tapStaleHandle, retryErr.message, retryErr)
          }

          throw retryErr
        }
      }

      if (response?.exceptionDetails) {
        return throwTapError(errors.tapBindingThrew, `${method} threw: ${response.exceptionDetails.exception?.description || response.exceptionDetails.text}`)
      }

      return response.result.value
    }

    return await fn({ call })
  } finally {
    await client.close().catch(() => {})
  }
}
