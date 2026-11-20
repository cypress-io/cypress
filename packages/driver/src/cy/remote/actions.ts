import _ from 'lodash'
import Promise from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import type { $Cy } from '../../cypress/cy'
import type { ICypress } from '../../cypress'
import type { Log } from '../../cypress/log'
import type { ActionOptions, ActionResult, ScrollOptions, SelectFileArgs, TypeOptions } from '../../remote/protocol'
import { callAgent, resolveRemoteSubject } from './index'
import type { RemoteElement, RemoteLocator } from './remote_element'

const ACTION_OPTIONS = ['force', 'position', 'x', 'y', 'scrollBehavior', 'waitForAnimations', 'animationDistanceThreshold', 'ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const
const TYPE_OPTIONS = [...ACTION_OPTIONS, 'delay', 'release', 'parseSpecialCharSequences'] as const

interface RemoteActionArgs {
  Cypress: ICypress
  cy: $Cy
  name: string
  subject: RemoteLocator
  options: Record<string, any>
  log?: Log
  // checks the resolved elements before any is acted on
  validate?: (resolved: RemoteElement) => void
  // resolves with no result when it skips the element
  perform: (index: number, timeout: number, resolved: RemoteElement) => Promise<ActionResult | null>
}

// Runs one action per element through the agent, which retries actionability
// itself until `timeout`, then verifies upcoming assertions against freshly
// resolved elements.
const runRemoteAction = ({ Cypress, cy, name, subject, options, log, validate, perform }: RemoteActionArgs) => {
  const timeout = options.timeout ?? Cypress.config('defaultCommandTimeout')

  // the agent enforces `timeout`, so the runnable's own timer must not race it
  cy.clearTimeout()

  return resolveRemoteSubject(Cypress, subject)
  .then((resolved) => {
    if (!resolved.length) {
      $errUtils.throwErrByPath('subject.not_element_empty_subject', {
        onFail: log,
        args: { name, subjectChain: cy.subjectChain() },
      })
    }

    if (['click', 'dblclick', 'rightclick'].includes(name) && options.multiple !== true && resolved.length > 1) {
      $errUtils.throwErrByPath('click.multiple_elements', {
        onFail: log,
        args: { cmd: name, num: resolved.length },
      })
    }

    if (name === 'type' && resolved.length > 1) {
      $errUtils.throwErrByPath('type.multiple_elements', {
        onFail: log,
        args: { num: resolved.length },
      })
    }

    validate?.(resolved)

    return Promise.mapSeries(_.range(resolved.length), (index) => perform(index, timeout, resolved))
    .then((performed) => {
      const results = _.compact(performed)

      log?.set({
        coords: _.last(results)?.coords,
        consoleProps: () => {
          return {
            'Applied To': resolved.node,
            'Elements': resolved.length,
            'Coords': _.map(results, 'coords'),
          }
        },
      })
    })
  })
  .catch((err) => $errUtils.throwErr(err, { onFail: log }))
  .then(() => {
    const verifyAssertions = () => {
      return cy.verifyUpcomingAssertions(subject, options, {
        onRetry: verifyAssertions,
        // the elements existed when acted on; an action can remove them, or close the tab they're in
        ensureExistenceFor: false,
      })
    }

    return verifyAssertions()
  })
}

export const remoteClick = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, options: Record<string, any>, event: 'click' | 'dblclick' | 'rightclick' = 'click') => {
  const log = Cypress.log({
    hidden: options.log === false,
    timeout: options.timeout,
  })

  return runRemoteAction({
    Cypress,
    cy,
    name: event,
    subject,
    options,
    log,
    perform: (index, timeout) => {
      return callAgent(Cypress, 'click', {
        steps: subject.steps,
        index,
        timeout,
        event,
        options: _.pick(options, ACTION_OPTIONS) as ActionOptions,
      }, timeout)
    },
  })
}

export const remoteType = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, chars: string, options: Record<string, any>) => {
  return runRemoteAction({
    Cypress,
    cy,
    name: 'type',
    subject,
    options,
    log: options._log,
    perform: (index, timeout) => {
      return callAgent(Cypress, 'type', {
        steps: subject.steps,
        index,
        timeout,
        chars,
        options: _.pick(options, TYPE_OPTIONS) as TypeOptions,
      }, timeout)
    },
  })
}

const createLog = (Cypress: ICypress, options: Record<string, any>) => {
  return options._log ?? Cypress.log({ hidden: options.log === false, timeout: options.timeout })
}

const elementAction = (Cypress: ICypress, cy: $Cy, name: string, subject: RemoteLocator, options: Record<string, any>, args: Omit<RemoteActionArgs, 'Cypress' | 'cy' | 'name' | 'subject' | 'options' | 'log'>) => {
  return runRemoteAction({ Cypress, cy, name, subject, options, log: createLog(Cypress, options), ...args })
}

const throwIfMultiple = (resolved: RemoteElement, errPath: string, log?: Log) => {
  if (resolved.length > 1) {
    $errUtils.throwErrByPath(errPath, { onFail: log, args: { num: resolved.length } })
  }
}

export const remoteClear = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, options: Record<string, any>) => {
  return elementAction(Cypress, cy, 'clear', subject, options, {
    perform: (index, timeout) => {
      return callAgent(Cypress, 'type', { steps: subject.steps, index, timeout, chars: '{selectall}{del}', clear: true, options: _.pick(options, TYPE_OPTIONS) as TypeOptions }, timeout)
    },
  })
}

// validated against the legacy driver's rules from what the agent reports, then clicked like cy.click
export const remoteCheck = (Cypress: ICypress, cy: $Cy, type: 'check' | 'uncheck', subject: RemoteLocator, values: unknown[], options: Record<string, any>) => {
  const log = createLog(Cypress, options)

  return runRemoteAction({
    Cypress,
    cy,
    name: type,
    subject,
    options,
    log,
    perform: (index, timeout, resolved) => {
      const el = resolved.elements[index]
      const inputType = el.attributes.type
      const acceptable = el.tagName === 'input' && (inputType === 'checkbox' || (type === 'check' && inputType === 'radio'))

      if (!acceptable) {
        $errUtils.throwErrByPath('check_uncheck.invalid_element', { onFail: log, args: { node: el.node, word: resolved.length > 1 ? 'contains' : 'is', phrase: type === 'check' ? ' and `:radio`' : '', cmd: type } })
      }

      if (values.length && !values.includes(el.value)) {
        return Promise.resolve(null)
      }

      if (values.length && !el.attributes.value) {
        $errUtils.throwErrByPath('check_uncheck.element_missing_value_attribute', { onFail: log, args: { node: el.node, cmd: type } })
      }

      if (el.checked === (type === 'check')) {
        return Promise.resolve(null)
      }

      return callAgent(Cypress, 'click', { steps: subject.steps, index, timeout, options: _.pick(options, ACTION_OPTIONS) as ActionOptions }, timeout)
    },
  })
}

export const remoteFocus = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, options: Record<string, any>) => {
  return elementAction(Cypress, cy, 'focus', subject, options, {
    validate: (resolved) => {
      const el = resolved.elements[0]

      if (!el.focusable && el.tagName !== 'body') {
        $errUtils.throwErrByPath('focus.invalid_element', { onFail: options._log, args: { node: el.node } })
      }

      throwIfMultiple(resolved, 'focus.multiple_elements', options._log)
    },
    perform: (index) => callAgent(Cypress, 'focus', { steps: subject.steps, index }).then(() => null),
  })
}

export const remoteBlur = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, options: Record<string, any>) => {
  return elementAction(Cypress, cy, 'blur', subject, options, {
    validate: (resolved) => {
      throwIfMultiple(resolved, 'blur.multiple_elements', options._log)
    },
    perform: (index, timeout, resolved) => {
      const el = resolved.elements[index]

      if (options.force || el.focused || el.tagName === 'body') {
        return callAgent(Cypress, 'blur', { steps: subject.steps, index }).then(() => null)
      }

      return callAgent(Cypress, 'resolve', { steps: [{ type: 'focused' }] }).then(({ elements }) => {
        if (!elements.length) {
          $errUtils.throwErrByPath('blur.no_focused_element', { onFail: options._log })
        }

        return $errUtils.throwErrByPath('blur.wrong_focused_element', { onFail: options._log, args: { node: elements[0].node } })
      })
    },
  })
}

export const remoteSubmit = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, options: Record<string, any>) => {
  return elementAction(Cypress, cy, 'submit', subject, options, {
    validate: (resolved) => {
      if (resolved.elements.some((el) => el.tagName !== 'form')) {
        $errUtils.throwErrByPath('submit.not_on_form', { onFail: options._log, args: { node: resolved.node, word: resolved.length > 1 ? 'contains' : 'is' } })
      }

      if (resolved.length > 1) {
        $errUtils.throwErrByPath('submit.multiple_forms', { onFail: options._log, args: { num: resolved.length } })
      }
    },
    perform: (index) => callAgent(Cypress, 'submit', { steps: subject.steps, index }).then(() => null),
  })
}

export const remoteTrigger = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, eventName: string, eventOptions: Record<string, unknown>, options: Record<string, any>) => {
  return elementAction(Cypress, cy, 'trigger', subject, options, {
    validate: (resolved) => throwIfMultiple(resolved, 'trigger.multiple_elements', options._log),
    perform: (index, timeout) => {
      return callAgent(Cypress, 'trigger', { steps: subject.steps, index, timeout, eventName, eventOptions, options: _.pick(options, ACTION_OPTIONS) as ActionOptions }, timeout)
    },
  })
}

export const remoteSelect = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, values: (string | number)[], options: Record<string, any>) => {
  return elementAction(Cypress, cy, 'select', subject, options, {
    validate: (resolved) => {
      const el = resolved.elements[0]

      if (el.tagName !== 'select') {
        $errUtils.throwErrByPath('select.invalid_element', { onFail: options._log, args: { node: resolved.node } })
      }

      throwIfMultiple(resolved, 'select.multiple_elements', options._log)

      if (el.attributes.multiple === undefined && values.length > 1) {
        $errUtils.throwErrByPath('select.invalid_multiple', { onFail: options._log })
      }
    },
    perform: (index, timeout) => {
      return callAgent(Cypress, 'select', { steps: subject.steps, index, timeout, values, options: _.pick(options, ACTION_OPTIONS) as ActionOptions }, timeout)
    },
  })
}

export const remoteSelectFile = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, files: SelectFileArgs['files'], action: SelectFileArgs['action'], options: Record<string, any>) => {
  return elementAction(Cypress, cy, 'selectFile', subject, options, {
    validate: (resolved) => throwIfMultiple(resolved, 'selectFile.multiple_elements', options._log),
    perform: (index, timeout) => {
      return callAgent(Cypress, 'selectFile', { steps: subject.steps, index, timeout, files, action, options: _.pick(options, ACTION_OPTIONS) as ActionOptions }, timeout)
    },
  })
}

export const remoteScrollIntoView = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, scroll: ScrollOptions, options: Record<string, any>) => {
  return elementAction(Cypress, cy, 'scrollIntoView', subject, options, {
    validate: (resolved) => throwIfMultiple(resolved, 'scrollIntoView.multiple_elements', options._log),
    perform: (index) => callAgent(Cypress, 'scrollIntoView', { steps: subject.steps, index, scroll }).then(() => null),
  })
}

// scrolls the window when there's no subject
export const remoteScrollTo = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator | undefined, x: number | string, y: number | string, scroll: ScrollOptions, options: Record<string, any>) => {
  const timeout = options.timeout ?? Cypress.config('defaultCommandTimeout')

  cy.clearTimeout()

  return callAgent(Cypress, 'scrollTo', { steps: subject?.steps ?? [], window: !subject, x, y, timeout, scroll }, timeout)
  .catch((err) => $errUtils.throwErr(err, { onFail: options._log }))
  .then(() => subject ?? null)
}
