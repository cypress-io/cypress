import _ from 'lodash'
import Promise from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import type { ICypress } from '../../cypress'
import type { Log } from '../../cypress/log'
import type { AgentContext, AgentError, AgentMethods, AgentResponse, FrameOwner, QueryStep, TabUrl } from '../../remote/protocol'
import { RemoteElement, RemoteLocator, isRemoteSubject } from './remote_element'

export { isRemoteElement, isRemoteSubject } from './remote_element'

export const isRemoteDriverEnabled = (Cypress: Pick<ICypress, 'config'>) => Cypress.config('experimentalRemoteDriver' as keyof Cypress.Config) === true

const getContext = (Cypress: ICypress): AgentContext => {
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

export const callAgent = <M extends keyof AgentMethods>(Cypress: ICypress, method: M, args: Parameters<AgentMethods[M]>[0], timeout?: number): Promise<ReturnType<AgentMethods[M]>> => {
  return Promise.try(() => {
    const { tab, frames, steps } = splitAtFrames(args.steps)

    return Cypress.automation('remote:agent', { method, context: getContext(Cypress), args: { ...args, steps }, frames, tab })
  })
  .then((reply) => {
    // Safe because `remote:agent` returns whatever the agent's `call` resolved with
    const response = reply as AgentResponse<ReturnType<AgentMethods[M]>>

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
