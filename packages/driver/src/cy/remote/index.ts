import _ from 'lodash'
import Promise from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import type { ICypress } from '../../cypress'
import type { Log } from '../../cypress/log'
import type { AgentContext, AgentError, AgentMethods, AgentResponse, EvaluateArgs, EvaluateResult, FrameOwner, QueryStep, TabUrl } from '../../remote/protocol'
import { fromPageValue, toPageValue } from './stub_values'
import { RemoteElement, RemoteLocator, isRemoteSubject } from './remote_element'

export { isRemoteElement, isRemoteSubject } from './remote_element'

export const isRemoteDriverEnabled = (Cypress: Pick<ICypress, 'config'>) => Cypress.config('experimentalRemoteDriver' as keyof Cypress.Config) === true

// AUT errors reach the driver asynchronously, so this waits for any thrown before it was called
export const flushRemoteErrors = (Cypress: AgentCypress) => {
  if (!isRemoteDriverEnabled(Cypress)) {
    return Promise.resolve()
  }

  return Promise.resolve(Cypress.automation('remote:errors:flush', {})).catch(() => {})
}

// what callAgent uses of Cypress
type AgentCypress = Pick<ICypress, 'config' | 'browser' | 'action'> & { automation: (message: string, data: unknown) => PromiseLike<unknown> }

const getContext = (Cypress: AgentCypress): AgentContext => {
  return {
    browser: Cypress.browser,
    config: {
      visibilityStrategy: Cypress.config('visibilityStrategy'),
      scrollBehavior: Cypress.config('scrollBehavior'),
    },
  }
}

const toError = (agentError: AgentError, timeout?: number) => {
  const err = new Error(agentError.message)

  err.name = agentError.name

  // jQuery's selector engine reports an invalid selector this way, and retrying can't fix it
  const retry = agentError.message.startsWith('Syntax error') ? false : agentError.retry

  _.extend(err, _.omitBy({ retry, type: agentError.type }, _.isUndefined))

  if (agentError.timedOut && timeout !== undefined) {
    const prefix = $errUtils.errByPath('miscellaneous.retry_timed_out', { ms: timeout }).message

    err.message = `${prefix}${err.message}`
  }

  return err
}

// The agent only sees its own frame, so the server runs each segment before a
// frame step in the frame that contains it and the rest in the innermost frame
const splitAtFrames = (allSteps: QueryStep[]) => {
  const frames: FrameOwner[] = []
  let tab: { url?: TabUrl } | undefined
  let steps: QueryStep[] = []

  for (const step of allSteps) {
    if (step.type === 'tab') {
      tab = { url: step.url }
    } else if (step.type === 'frame') {
      frames.push({ steps, selector: step.selector })
      steps = []
    } else {
      steps.push(step)
    }
  }

  return { tab, frames, steps: steps.length ? steps : [{ type: 'get', selector: 'body' } as const] }
}

export const callAgent = <M extends keyof AgentMethods>(Cypress: AgentCypress, method: M, args: Parameters<AgentMethods[M]>[0], timeout?: number): Promise<ReturnType<AgentMethods[M]>> => {
  let isInAutDocument = false

  return Promise.try(() => {
    const { tab, frames, steps } = splitAtFrames(args.steps)

    isInAutDocument = !tab && !frames.length

    return Cypress.automation('remote:agent', { method, context: getContext(Cypress), args: { ...args, steps }, frames, tab })
  })
  .then((reply) => {
    // Safe because `remote:agent` returns whatever the agent's `call` resolved with
    const response = reply as AgentResponse<ReturnType<AgentMethods[M]>>

    // a tab or an iframe unloading, or a popup closing, doesn't take the AUT's page with it
    if (response.navigating && isInAutDocument) {
      Cypress.action('app:remote:navigation', { event: 'started' })
    }

    if (response.ok) {
      return response.value
    }

    throw toError(response.error, timeout)
  })
}

export const resolveRemoteSubject = (Cypress: ICypress, locator: RemoteLocator, log?: Log) => {
  return callAgent(Cypress, 'resolve', { steps: locator.steps })
  .then(({ elements }) => {
    const resolved = new RemoteElement(locator, elements)

    log?.set({
      consoleProps: () => {
        return {
          Selector: locator.selector,
          Yielded: resolved.length ? resolved.node : undefined,
          Elements: resolved.length,
        }
      },
    })

    return resolved
  })
}

export const throwUnsupportedOption = (cmd: string, option: string) => {
  $errUtils.throwErrByPath('remote_driver.unsupported_option', { args: { cmd, option } })
}

// A remote query chains only off nothing or another remote query's subject.
export const extendRemoteSubject = (cmd: string, subject: unknown, step: QueryStep, selector: string) => {
  if (subject === undefined) {
    return new RemoteLocator([step], selector)
  }

  if (isRemoteSubject(subject)) {
    return subject.extend(step, selector)
  }

  return $errUtils.throwErrByPath('remote_driver.unsupported_subject', { args: { cmd } })
}

// A cy.visit callback runs in the AUT's own window, so it's sent as source and can't close over test values
export const serializeCallback = (fn: Function) => {
  const source = fn.toString()

  // a method shorthand such as `onLoad (win) {}` is only valid source as an object member
  if (/^(async\s+)?(function\b|\(|[\w$]+\s*=>)/.test(source)) {
    return source
  }

  return `Object.values({ ${source} })[0]`
}

// The remote subject a query inside .within() is scoped to, which only a remote subject can be
export const getRemoteWithinSubject = (getSubject: () => unknown, cmd: string) => {
  const within = getSubject()

  if (!isRemoteSubject(within)) {
    return throwUnsupportedOption(cmd, 'within')
  }

  return within
}

// .its() and .invoke() are synchronous queries that retry, while the agent answers asynchronously,
// so each attempt starts a call and the query reads what the last finished call returned
export const createRemoteEvaluator = (Cypress: AgentCypress, kind: EvaluateArgs['kind'], path: string | number, args: unknown[], cmd: string) => {
  let result: EvaluateResult | undefined
  let error: Error | undefined
  let pending = false
  // a call starts only once a retry has seen the last outcome, so .invoke() runs once unless an assertion retries it
  let unseen = false

  return (subject: RemoteLocator): EvaluateResult => {
    if (args.some((arg) => typeof arg === 'function')) {
      $errUtils.throwErrByPath('remote_driver.unsupported_argument', { args: { cmd }, errProps: { retry: false } })
    }

    if (!pending && !unseen) {
      pending = true

      callAgent(Cypress, 'evaluate', { steps: subject.steps, kind, path: String(path), args: args.map(toPageValue) })
      .then((value) => {
        result = value
        error = undefined
      }, (err) => {
        error = err
      })
      .finally(() => {
        pending = false
        unseen = true
      })
    }

    if (!pending) {
      unseen = false
    }

    if (error) {
      throw error
    }

    if (!result) {
      throw $errUtils.cypressErrByPath('remote_driver.awaiting_aut', { args: { cmd } })
    }

    return result
  }
}

// an index path like its(0) yields that element as a remote subject; the subject itself comes back tagged
export const fromEvaluatedValue = (subject: RemoteLocator, path: string | number, { value, has }: EvaluateResult) => {
  if (/^\d+$/.test(String(path))) {
    return has ? subject.extend({ type: 'traversal', method: 'eq', args: [Number(path)] }, subject.selector) : undefined
  }

  if (_.isPlainObject(value) && Reflect.get(value as object, '__cypressRemote') === 'subject') {
    return subject
  }

  return fromPageValue(value)
}
