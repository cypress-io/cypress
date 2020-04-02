const _ = require('lodash')
const Promise = require('bluebird')

const $dom = require('../../dom')
const $errUtils = require('../../cypress/error_utils')

const reExistence = /exist/
const reEventually = /^eventually/
const reHaveLength = /length/

module.exports = function (Commands, Cypress, cy, state, config) {
  const shouldFnWithCallback = function (subject, fn) {
    return Promise
    .try(() => {
      const remoteSubject = cy.getRemotejQueryInstance(subject)

      return fn.call(this, remoteSubject != null ? remoteSubject : subject)
    }).return(subject)
  }

  const shouldFn = function (subject, chainers, ...args) {
    let err; let isCheckingExistence

    if (_.isFunction(chainers)) {
      return shouldFnWithCallback.apply(this, arguments)
    }

    let exp = cy.expect(subject).to
    const originalChainers = chainers

    const throwAndLogErr = (err) => {
      // since we are throwing our own error
      // without going through the assertion we need
      // to ensure our .should command gets logged
      const log = Cypress.log({
        name: 'should',
        type: 'child',
        message: [].concat(originalChainers, args),
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

    if (reEventually.test(chainers)) {
      err = $errUtils.cypressErrByPath('should.eventually_deprecated')
      err.retry = false
      throwAndLogErr(err)
    }

    // are we doing a length assertion?
    if (reHaveLength.test(chainers) || reExistence.test(chainers)) {
      isCheckingExistence = true
    }

    const applyChainer = function (memo, value) {
      if (value === lastChainer) {
        if (_.isFunction(memo[value])) {
          try {
            return memo[value].apply(memo, args)
          } catch (err) {
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
          return memo[value]
        }
      } else {
        return memo[value]
      }
    }

    const applyChainers = function () {
      // if we're not doing existence or length assertions
      // then check to ensure the subject exists
      // in the DOM if its a DOM subject
      // because its possible we're asserting about an
      // element which has left the DOM and we always
      // want to auto-fail on those
      if (!isCheckingExistence && $dom.isElement(subject)) {
        cy.ensureAttached(subject, 'should')
      }

      const newExp = _.reduce(chainers, (memo, value) => {
        if (!(value in memo)) {
          err = $errUtils.cypressErrByPath('should.chainer_not_found', { args: { chainer: value } })
          err.retry = false
          throwAndLogErr(err)
        }

        return applyChainer(memo, value)
      }

      , exp)

      exp = newExp != null ? newExp : exp
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

  return Commands.addAll({ type: 'assertion', prevSubject: true }, {
    should () {
      return shouldFn.apply(this, arguments)
    },

    and () {
      return shouldFn.apply(this, arguments)
    },
  })
}
