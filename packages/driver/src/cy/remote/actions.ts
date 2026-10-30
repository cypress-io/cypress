import _ from 'lodash'
import Promise from 'bluebird'
import $errUtils from '../../cypress/error_utils'
import type { $Cy } from '../../cypress/cy'
import type { ICypress } from '../../cypress'
import type { Log } from '../../cypress/log'
import type { ActionOptions, ActionResult, TypeOptions } from '../../remote/protocol'
import { callAgent, resolveRemoteSubject } from './index'
import type { RemoteLocator } from './remote_element'

const ACTION_OPTIONS = ['force', 'position', 'x', 'y', 'scrollBehavior', 'waitForAnimations', 'animationDistanceThreshold', 'ctrlKey', 'altKey', 'shiftKey', 'metaKey'] as const
const TYPE_OPTIONS = [...ACTION_OPTIONS, 'delay', 'release', 'parseSpecialCharSequences'] as const

interface RemoteActionArgs {
  Cypress: ICypress
  cy: $Cy
  name: 'click' | 'type'
  subject: RemoteLocator
  options: Record<string, any>
  log?: Log
  perform: (index: number, timeout: number) => Promise<ActionResult>
}

// Runs one action per element through the agent, which retries actionability
// itself until `timeout`, then verifies upcoming assertions against freshly
// resolved elements.
const runRemoteAction = ({ Cypress, cy, name, subject, options, log, perform }: RemoteActionArgs) => {
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

    if (name === 'click' && options.multiple !== true && resolved.length > 1) {
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

    return Promise.mapSeries(_.range(resolved.length), (index) => perform(index, timeout))
    .then((results) => {
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
      })
    }

    return verifyAssertions()
  })
}

export const remoteClick = (Cypress: ICypress, cy: $Cy, subject: RemoteLocator, options: Record<string, any>) => {
  const log = Cypress.log({
    hidden: options.log === false,
    timeout: options.timeout,
  })

  return runRemoteAction({
    Cypress,
    cy,
    name: 'click',
    subject,
    options,
    log,
    perform: (index, timeout) => {
      return callAgent(Cypress, 'click', {
        steps: subject.steps,
        index,
        timeout,
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
