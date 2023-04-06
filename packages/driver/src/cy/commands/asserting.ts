import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../../dom'
import $errUtils from '../../cypress/error_utils'

const reExistence = /exist/
const reHaveLength = /length/

const onBeforeLog = (log, command, commandLogId) => {
  log.set('commandLogId', commandLogId)

  const previousLogInstance = command.get('logs').find(_.matchesProperty('attributes.commandLogId', commandLogId))

  if (previousLogInstance) {
    // log.merge unsets any keys that aren't set on the new log instance. We
    // copy over 'snapshots' beforehand so that existing snapshots aren't lost
    // in the merge operation.
    log.set('snapshots', previousLogInstance.get('snapshots'))
    previousLogInstance.merge(log)

    if (previousLogInstance.get('end')) {
      previousLogInstance.end()
    }

    // Returning false prevents this new log from being added to the command log
    return false
  }

  return true
}

export default function (Commands, Cypress, cy, state) {
  const shouldFnWithCallback = function (subject, fn) {
    state('current')?.set('followedByShouldCallback', true)

    const commandEnqueued = (obj: Cypress.EnqueuedCommandAttributes) => {
      $errUtils.throwErrByPath(
        'should.command_inside_should', {
          args: { action: obj.name },
          errProps: { retry: false },
        },
      )
    }

    return Promise
    .try(() => {
      const remoteSubject = cy.getRemotejQueryInstance(subject)

      Cypress.once('command:enqueued', commandEnqueued)

      return fn.call(this, remoteSubject ? remoteSubject : subject)
    })
    .finally(() => {
      Cypress.removeListener('command:enqueued', commandEnqueued)
    })
    .tap(() => {
      state('current')?.set('followedByShouldCallback', false)
    })
    .return(subject)
  }

  const shouldFn = function (subject, chainers, ...args) {
    const command = cy.state('current')

    // Most commands are responsible for creating and managing their own log messages directly.
    // .should(), however, is an exception - it is invoked by earlier commands, as part of
    // `verifyUpcomingAssertions`. This callback can also be invoked any number of times, but we only want
    // to display a few log messages (one for each assertion).

    // Therefore, we each time Cypress.log() is called, we need a way to identify if this log call
    // a duplicate of a previous one that's just being retried. This is the purpose of `commandLogId` - it should
    // remain the same across multiple invocations of verifyUpcomingAssertions().

    // It is composed of two parts: assertionIndex and logIndex. Assertion index is "which .should() command are we
    // inside". Consider the following case:
    // `cy.noop(3).should('be.lessThan', 4).should('be.greaterThan', 2)`
    // cy.state('current') is always the 'noop' command, which rolls up the two upcoming assertions, lessThan and
    // greaterThan. `assertionIndex` lets us tell them apart even though they have the same logIndex of 0 (since it
    // resets each time .should() is called).

    // As another case, consider:
    // cy.noop(3).should((n) => { expect(n).to.be.lessThan(4); expect(n).to.be.greaterThan(2); })
    // Here, assertionIndex is 0 for both - one .should() block generates two log messages. In this case, logIndex is
    // used to tell them apart, since it increments each time Cypress.log() is called within a single retry of a single
    // .should().
    const assertionIndex = cy.state('upcomingAssertions') ? cy.state('upcomingAssertions').indexOf(command.get('currentAssertionCommand')) : 0
    let logIndex = 0

    if (_.isFunction(chainers)) {
      cy.state('onBeforeLog', (log) => {
        logIndex++

        return onBeforeLog(log, command, `${assertionIndex}-${logIndex}`)
      })

      try {
        return shouldFnWithCallback.apply(this, [subject, chainers])
      } finally {
        cy.state('onBeforeLog', undefined)
      }
    }

    let exp = cy.expect(subject).to
    const originalChainers = chainers

    const throwAndLogErr = (err) => {
      // since we are throwing our own error
      // without going through the assertion we need
      // to ensure our .should command gets logged
      logIndex++
      const log = Cypress.log({
        name: 'should',
        type: 'child',
        message: ([] as any[]).concat(originalChainers, args),
        end: true,
        snapshot: true,
        error: err,
      })

      return $errUtils.throwErr(err, { onFail: log })
    }

    chainers = chainers.split('.')
    const lastChainer = _.last(chainers)

    // backup the original assertion subject
    const originalObj = exp._obj
    let err

    const isCheckingExistence = reExistence.test(chainers)
    const isCheckingLengthOrExistence = isCheckingExistence || reHaveLength.test(chainers)

    const applyChainer = function (memo, value) {
      logIndex++
      cy.state('onBeforeLog', (log) => {
        return onBeforeLog(log, command, `${assertionIndex}-${logIndex}`)
      })

      try {
        if (value === lastChainer && !isCheckingExistence) {
          // https://github.com/cypress-io/cypress/issues/16006
          // Referring some commands like 'visible'  triggers assert function in chai_jquery.js
          // It creates duplicated messages and confuses users.
          const cmd = memo[value]

          if (_.isFunction(cmd)) {
            try {
              return cmd.apply(memo, args)
            } catch (err: any) {
              // if we made it all the way to the actual
              // assertion but its set to retry false then
              // we need to log out this .should since there
              // was a problem with the actual assertion syntax
              if (err.retry === false) {
                return throwAndLogErr(err)
              }

              throw err
            }
          } else {
            return cmd
          }
        } else {
          return memo[value]
        }
      } finally {
        cy.state('onBeforeLog', undefined)
      }
    }

    const applyChainers = function () {
      // if we're not doing existence or length assertions
      // then check to ensure the subject exists
      // in the DOM if its a DOM subject
      // because its possible we're asserting about an
      // element which has left the DOM and we always
      // want to auto-fail on those
      if (!isCheckingLengthOrExistence && $dom.isElement(subject)) {
        Cypress.ensure.isAttached(subject, 'should', cy)
      }

      const newExp = _.reduce(chainers, (memo, value) => {
        if (!(value in memo)) {
          err = $errUtils.cypressErrByPath('should.chainer_not_found', { args: { chainer: value } })
          err.retry = false
          throwAndLogErr(err)
        }

        // https://github.com/cypress-io/cypress/issues/883
        // A single chainer used that is not an actual assertion, like '.should('be', 'true')'
        if (chainers.length < 2 && !isCheckingExistence && !_.isFunction(memo[value])) {
          err = $errUtils.cypressErrByPath('should.language_chainer', { args: { originalChainers } })
          err.retry = false
          throwAndLogErr(err)
        }

        return applyChainer(memo, value)
      }, exp)

      exp = newExp ? newExp : exp
    }

    return Promise.try(applyChainers).then(() => {
      // if the _obj has been mutated then we
      // are chaining assertion properties and
      // should return this new subject
      if (originalObj !== exp._obj) {
        return exp._obj
      }

      return subject
    })
  }

  Commands.addAll({ type: 'assertion', prevSubject: true }, {
    should () {
      // Cast to `any` to pass all arguments
      // eslint-disable-next-line prefer-rest-params
      return shouldFn.apply(this, arguments as any)
    },

    and () {
      // Cast to `any` to pass all arguments
      // eslint-disable-next-line prefer-rest-params
      return shouldFn.apply(this, arguments as any)
    },
  })
}
