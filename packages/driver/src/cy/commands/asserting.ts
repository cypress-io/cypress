import _ from 'lodash'

import $dom from '../../dom'
import $errUtils from '../../cypress/error_utils'

const reExistence = /exist|undefined|ok/
const reHaveLength = /length/

const onBeforeLog = (log, command, logIndex) => {
  log.set('type', 'child')

  // If we have an error message, and hit this point, we're in the middle of retrying a .should() command, and want
  // the log displayed in the 'pending' state. It will be 'cleaned up' (ended, and a snapshot gathered) when the
  // selector finally fails entirely.
  if (log.get('error')) {
    log.set({
      end: false,
      _error: log.get('error'),
      error: undefined,
    })
  }

  const previousLogInstance = command.get('logs') && command.get('logs')[logIndex]

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
  Cypress.on('command:enqueued', (obj) => {
    if ((obj.name === 'should' || obj.name === 'and')) {
      const isCheckingLengthOrExistence = reExistence.test(obj.args[0]) || reHaveLength.test(obj.args[0])

      if (isCheckingLengthOrExistence) {
        obj.prev.set('skipExistenceAssertion', true)
      }
    }
  })

  function should (chainers, ...args) {
    cy.ensureChildCommand(this, args)

    const originalChainers = chainers
    const isCheckingExistence = reExistence.test(chainers)
    const isCheckingLengthOrExistence = isCheckingExistence || reHaveLength.test(chainers)
    const command = this

    if (!_.isFunction(chainers)) {
      chainers = chainers.split('.')
    }

    const lastChainer = _.last(chainers)

    const applyChainer = function (memo, value) {
      if (value === lastChainer && !isCheckingExistence) {
        // https://github.com/cypress-io/cypress/issues/16006
        // Referring some commands like 'visible'  triggers assert function in chai_jquery.js
        // It creates duplicated messages and confuses users.
        const cmd = memo[value]

        if (_.isFunction(cmd)) {
          return cmd.apply(memo, args)
        }

        return cmd
      }

      return memo[value]
    }

    // .should() is a special case: it inherits timeouts from previous commands, rather than having the option to pass
    // one in directly. This is a relic of the time when it was executed as part of the resolution of previous
    // commands, rather than as its own separate thing.
    const prevTimeout = this.get('prev').get('timeout')

    if (prevTimeout != null) {
      this.set('timeout', prevTimeout)
    }

    return function (subject) {
      /*
       * Most commands are responsible for creating and managing their own log messages directly.
       *.should(), however, is an exception - it is invoked by earlier commands, as part of
       * `verifyUpcomingAssertions`. This callback can also be invoked any number of times, but we only want
       * to display a few log messages (one for each assertion).

       * Therefore, we each time Cypress.log() is called, we need a way to identify if this log call
       * a duplicate of a previous one that's being retried. This is the purpose of `logIndex` - it should
       * remain consistent across multiple invocations of should().

       * As an example:
       * cy
       *   .noop(3)
       *   .should((n) => {
       *     expect(n).to.be.lessThan(4);
       *     expect(n).to.be.greaterThan(2);
       *   })
       *
       * logIndex is used to tell them apart, since it increments each time Cypress.log() is called within a single
       * retry of .should().

       * It starts at -1 so that the first ingcrement brings it to 0.
       */
      let logIndex = -1

      cy.state('onBeforeLog', (log) => {
        logIndex++

        return onBeforeLog(log, command, logIndex)
      })

      try {
        let exp = cy.expect(subject).to

        // if we're not doing existence or length assertions
        // then check to ensure the subject exists
        // in the DOM if its a DOM subject
        // because its possible we're asserting about an
        // element which has left the DOM and we always
        // want to auto-fail on those
        if (!isCheckingLengthOrExistence && $dom.isElement(subject)) {
          cy.ensureAttached(subject, 'should')
        }

        if (_.isFunction(chainers)) {
          const remoteSubject = cy.getRemotejQueryInstance(subject) || subject

          chainers.call(cy.state('ctx'), remoteSubject)

          return subject
        }

        exp = _.reduce(chainers, (memo, value) => {
          if (!(value in memo)) {
            const err = $errUtils.cypressErrByPath('should.chainer_not_found', { args: { chainer: value } })

            err.retry = false
            throw err
          }

          // https://github.com/cypress-io/cypress/issues/883
          // A single chainer used that is not an actual assertion, like '.should('be', 'true')'
          if (chainers.length < 2 && !isCheckingExistence && !_.isFunction(memo[value])) {
            const err = $errUtils.cypressErrByPath('should.language_chainer', { args: { originalChainers } })

            err.retry = false
            throw err
          }

          return applyChainer(memo, value)
        }, exp)

        return exp._obj
      } finally {
        cy.state('onBeforeLog', undefined)
      }
    }
  }

  Commands.addSelector('should', null, should)
  Commands.addSelector('and', null, should)
}
