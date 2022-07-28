import _ from 'lodash'

import $dom from '../../dom'
import $errUtils from '../../cypress/error_utils'

const reExistence = /exist/
const reHaveLength = /length/

export default function (Commands, Cypress, cy, state) {
  Cypress.on('command:enqueued', (obj) => {
    if ((obj.name === 'shouldS' || obj.name === 'andS')) {
      const isCheckingLengthOrExistence = reExistence.test(obj.args[0]) || reHaveLength.test(obj.args[0])

      if (isCheckingLengthOrExistence) {
        obj.prev.set('skipExistenceAssertion', true)
      }
    }
  })

  function shouldS (chainers, ...args) {
    if (_.isFunction(chainers)) {
      throw new Error('TODO')
    }

    const originalChainers = chainers
    const isCheckingExistence = reExistence.test(chainers)
    const isCheckingLengthOrExistence = isCheckingExistence || reHaveLength.test(chainers)

    chainers = chainers.split('.')
    const lastChainer = _.last(chainers)

    const log = Cypress.log({
      name: 'should',
      type: 'child',
      message: ([] as any[]).concat(originalChainers, args),
      end: true,
      snapshot: true,
    })

    const throwAndLogErr = (err) => {
      return $errUtils.throwErr(err, { onFail: log })
    }

    const applyChainer = function (memo, value) {
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
    }

    return function (subject) {
      log.set({
        $el: subject,
        consoleProps: () => {
          return {
            Yielded: $dom.getElements(subject),
            Elements: subject.length,
          }
        },
      })

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

      const newExp = _.reduce(chainers, (memo, value) => {
        if (!(value in memo)) {
          const err = $errUtils.cypressErrByPath('should.chainer_not_found', { args: { chainer: value } })

          err.retry = false
          throwAndLogErr(err)
        }

        // https://github.com/cypress-io/cypress/issues/883
        // A single chainer used that is not an actual assertion, like '.should('be', 'true')'
        if (chainers.length < 2 && !isCheckingExistence && !_.isFunction(memo[value])) {
          const err = $errUtils.cypressErrByPath('should.language_chainer', { args: { originalChainers } })

          err.retry = false
          throwAndLogErr(err)
        }

        return applyChainer(memo, value)
      }, exp)

      exp = newExp || exp

      return exp._obj
    }
  }

  Commands.addSelector('shouldS', null, shouldS)
  Commands.addSelector('andS', null, shouldS)
}
