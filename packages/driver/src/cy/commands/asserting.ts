import _ from 'lodash'

import $dom from '../../dom'
import $errUtils from '../../cypress/error_utils'
import { isCheckingExistence, isCheckingLength } from '../assertions'

// Most commands manage their own log messages. However, assertion logging is handled
// by ../assertions.ts, because assertions can be called either through `.should('be.true')'
// or by `expect(foo).to.be.true`.
// When .should() is retrying however, this would result in a large number of duplicated
// log messages - so this onBeforeLog function coallates them, merging each log instance
// with its previous incarnation.
const onBeforeLog = (logs) => {
  let chainerIndex = -1

  return (log) => {
    chainerIndex++

    if (logs[chainerIndex]) {
      if (logs[chainerIndex].get('state') !== 'pending') {
        return false
      }

      // log.merge unsets any keys that aren't set on the new log instance. We
      // copy over 'snapshots' beforehand so that existing snapshots aren't lost
      // in the merge operation.
      log.set('snapshots', logs[chainerIndex].get('snapshots'))
      logs[chainerIndex].merge(log)

      if (logs[chainerIndex].get('end')) {
        logs[chainerIndex].end()
      }

      return false
    }

    logs[chainerIndex] = log

    return true
  }
}

const commandEnqueued = (obj: Cypress.EnqueuedCommandAttributes) => {
  $errUtils.throwErrByPath(
    'should.command_inside_should', {
      args: { action: obj.name },
      errProps: { retry: false },
    },
  )
}

export default function (Commands, Cypress, cy, state) {
  const shouldWithCallback = (fn, logs) => {
    return (subject) => {
      state('current')?.set('followedByShouldCallback', true)
      state('onBeforeLog', onBeforeLog(logs))
      Cypress.once('command:enqueued', commandEnqueued)

      try {
        const remoteSubject = cy.getRemotejQueryInstance(subject)

        fn.call(state('ctx'), remoteSubject ? remoteSubject : subject)
      } finally {
        state('current')?.set('followedByShouldCallback', false)
        state('onBeforeLog', undefined)
        Cypress.removeListener('command:enqueued', commandEnqueued)
      }

      return subject
    }
  }

  function should (chainerString, ...args) {
    Cypress.ensure.isChildCommand(this, args, cy)
    this.set('timeout', this.get('prev').get('timeout'))

    const logs = {}

    if (_.isFunction(chainerString)) {
      return shouldWithCallback(chainerString, logs)
    }

    const chainers = chainerString.split('.')
    const lastChainer = _.last(chainers)

    const checkingExistence = isCheckingExistence([chainerString])
    const checkingLengthOrExistence = checkingExistence || isCheckingLength([chainerString])

    return (subject) => {
      let exp = cy.expect(subject).to

      // backup the original assertion subject
      const originalObj = exp._obj

      // if we're not doing existence or length assertions
      // then check to ensure the subject exists
      // in the DOM if its a DOM subject
      // because its possible we're asserting about an
      // element which has left the DOM and we always
      // want to auto-fail on those
      if (!checkingLengthOrExistence && $dom.isElement(subject)) {
        Cypress.ensure.isAttached(subject, 'should', cy)
      }

      state('onBeforeLog', onBeforeLog(logs))

      // Unlike most queries, we don't create a log message by default - the code in
      // ../assertions.ts will create one when we run the assertions below.
      // However, if we're throwing an error, it might be before any assertions
      // have run for this command - in that case, we need a log message to 'hang' the error
      // off of (mostly for purposes of a DOM snapshot).
      const addLogIfNoneExists = () => {
        if (Object.keys(logs).length === 0) {
          Cypress.log({ message: [chainerString, ...args] })
        }
      }

      try {
        const newExp = _.reduce(chainers, (memo, value) => {
          if (!(value in memo)) {
            addLogIfNoneExists()
            const err = $errUtils.cypressErrByPath('should.chainer_not_found', { args: { chainer: value } })

            err.retry = false
            $errUtils.throwErr(err)
          }

          // https://github.com/cypress-io/cypress/issues/883
          // A single chainer used that is not an actual assertion, like '.should('be', 'true')'
          if (chainers.length < 2 && !checkingExistence && !_.isFunction(memo[value])) {
            addLogIfNoneExists()
            const err = $errUtils.cypressErrByPath('should.language_chainer', { args: { originalChainers: chainerString } })

            err.retry = false
            $errUtils.throwErr(err)
          }

          if (value === lastChainer) {
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
                  addLogIfNoneExists()
                  $errUtils.throwErr(err)
                }

                throw err
              }
            } else {
              return cmd
            }
          } else {
            return memo[value]
          }
        }, exp)

        exp = newExp ? newExp : exp

        // if the _obj has been mutated then we
        // are chaining assertion properties and
        // should return this new subject
        return originalObj !== exp._obj ? exp._obj : subject
      } catch (err) {
        // Some commands want a chance to update the messages thrown by following assertions, for better legibility.
        // See querying.ts and traversals.ts, specifically `this.set('onFail', (err) => {`
        this.get('prev')?.get('onFail')?.(err)
        throw err
      } finally {
        state('onBeforeLog', undefined)
      }
    }
  }

  Commands.addQuery('should', should)
  Commands.addQuery('and', should)
}
