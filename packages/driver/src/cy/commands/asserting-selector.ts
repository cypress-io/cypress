import _ from 'lodash'

import $dom from '../../dom'
import $errUtils from '../../cypress/error_utils'

const reExistence = /exist/
const reHaveLength = /length/

/*
 * __internalSelectorShould is a proof-of-concept of a selector command that replicates the functionality of
 * cy.should(). It should be considered unstable and experimental, not suitable for general use.
 *
 * It exists as a platform to test the development as use of selector commands in the Detached DOM effort, and is merged
 * as-is in an effort to avoid long-running branches and allow incremental reviews. It is intended as a candidate to
 * eventually replace cy.get() entirely.
 *
 * https://github.com/cypress-io/cypress/issues/7306
 */
export default function (Commands, Cypress, cy, state) {
  Cypress.on('command:enqueued', (obj) => {
    if ((obj.name === 'shouldS' || obj.name === 'andS')) {
      const isCheckingLengthOrExistence = reExistence.test(obj.args[0]) || reHaveLength.test(obj.args[0])

      if (isCheckingLengthOrExistence) {
        obj.prev.set('skipExistenceAssertion', true)
      }
    }
  })

  function should (chainers, ...args) {
    if (_.isFunction(chainers)) {
      throw new Error('TODO')
    }

    const originalChainers = chainers
    const isCheckingExistence = reExistence.test(chainers)
    const isCheckingLengthOrExistence = isCheckingExistence || reHaveLength.test(chainers)

    chainers = chainers.split('.')
    const lastChainer = _.last(chainers)

    const applyChainer = function (memo, value) {
      if (value === lastChainer && !isCheckingExistence) {
        // https://github.com/cypress-io/cypress/issues/16006
        // Referring some commands like 'visible'  triggers assert function in chai_jquery.js
        // It creates duplicated messages and confuses users.
        const cmd = memo[value]

        if (_.isFunction(cmd)) {
          return cmd.apply(memo, args)
        } else {
          return cmd
        }
      } else {
        return memo[value]
      }
    }

    return function (subject) {

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
    }
  }

  Commands.addSelector('should', null, should)
  Commands.addSelector('and', null, should)
}
