import _ from 'lodash'
import Promise from 'bluebird'

import $dom from '../dom'
import $errUtils from '../cypress/error_utils'
import type { ICypress } from '../cypress'
import type { $Cy } from '../cypress/cy'

// TODO
// bTagOpen + bTagClosed
// are duplicated in assertions.coffee
const butRe = /,? but\b/
const bTagOpen = /\*\*/g
const bTagClosed = /\*\*/g
const stackTracesRe = / at .*\n/gm

const IS_DOM_TYPES = [$dom.isElement, $dom.isDocument, $dom.isWindow]

const invokeWith = (value) => {
  return (fn) => {
    return fn(value)
  }
}

const functionHadArguments = (current) => {
  const fn = current && current.get('args') && current.get('args')[0]

  return fn && _.isFunction(fn) && (fn.length > 0)
}

const isAssertionType = (cmd) => {
  return cmd && cmd.is('assertion')
}

const isDomSubjectAndMatchesValue = (value, subject) => {
  const allElsAreTheSame = () => {
    const els1 = $dom.getElements(value)
    const els2 = $dom.getElements(subject)

    // no difference
    return _.difference(els1, els2).length === 0
  }

  // iterate through each dom type until we
  // find the function for this particular value
  const isDomTypeFn = _.find(IS_DOM_TYPES, invokeWith(value))

  if (isDomTypeFn) {
    // then check that subject also matches this
    // and that all the els are the same
    return isDomTypeFn(subject) && allElsAreTheSame()
  }

  return false
}

type Parsed = {
  subject?: JQuery<any>
  actual?: any
  expected?: any
}

// Rules:
// 1. always remove value
// 2. if value is a jquery object set a subject
// 3. if actual is undefined or its not expected remove both actual + expected
const parseValueActualAndExpected = (value, actual, expected) => {
  const obj: Parsed = { actual, expected }

  if ($dom.isJquery(value)) {
    obj.subject = value

    if (_.isUndefined(actual) || (actual !== expected)) {
      delete obj.actual
      delete obj.expected
    }
  }

  return obj
}

export const create = (Cypress: ICypress, cy: $Cy) => {
  const getUpcomingAssertions = () => {
    const index = cy.state('index') + 1

    const assertions: any[] = []

    // grab the rest of the queue'd commands
    for (let cmd of cy.queue.slice(index)) {
      // don't break on utilities, just skip over them
      if (cmd.is('utility')) {
        continue
      }

      // grab all of the queued commands which are
      // assertions and match our current chainerId
      if (cmd.is('assertion')) {
        assertions.push(cmd)
      } else {
        break
      }
    }

    return assertions
  }

  const injectAssertionFns = (cmds) => {
    return _.map(cmds, injectAssertion)
  }

  const injectAssertion = (cmd) => {
    return ((subject) => {
      // set assertions to itself or empty array
      if (!cmd.get('assertions')) {
        cmd.set('assertions', [])
      }

      // reset the assertion index back to 0
      // so we can track assertions and merge
      // them up with existing ones
      cmd.set('assertionIndex', 0)

      if (cy.state('current') != null) {
        cy.state('current').set('currentAssertionCommand', cmd)
      }

      return cmd.get('fn').originalFn.apply(
        cy.state('ctx'),
        [subject].concat(cmd.get('args')),
      )
    })
  }

  const assertFn = (passed, message, value, actual, expected, error, verifying = false) => {
    // slice off everything after a ', but' or ' but ' for passing assertions, because
    // otherwise it doesn't make sense:
    // "expected <div> to have a an attribute 'href', but it was 'href'"
    if (message && passed && butRe.test(message)) {
      message = message.substring(0, message.search(butRe))
    }

    if (value && value.isSinonProxy) {
      message = message.replace(stackTracesRe, '\n')
    }

    let parsed = parseValueActualAndExpected(value, actual, expected)
    // TODO: make it more specific after defining the type for Cypress.log().
    let obj: Record<string, any> = {
      ...parsed,
    }

    if ($dom.isElement(value)) {
      obj.$el = $dom.wrap(value)
    }

    // `verifying` represents whether we're deciding whether or not to resolve
    // a command (true) or of we're actually performing a user-facing assertion
    // (false).

    // If we're verifying upcoming assertions (implicit or explicit),
    // then we don't need to take a DOM snapshot - one will be taken later when
    // retries time out or the command otherwise entirely fails or passes.
    // We save the error on _error because we may use it to construct the
    // timeout error which we eventually do display to the user.

    // If we're actually performing an assertion which will be displayed to the
    // user though, then we want to take a DOM snapshot and display this error
    // (if any) in the log message on screen.
    if (verifying) {
      obj._error = error
    } else {
      obj.end = true
      obj.snapshot = true
      obj.error = error
    }

    const isChildLike = (subject, current) => {
      return (value === subject) ||
        isDomSubjectAndMatchesValue(value, subject) ||
        // if our current command is an assertion type
        isAssertionType(current) ||
        // are we currently verifying assertions?
        (cy.state('upcomingAssertions') && cy.state('upcomingAssertions').length > 0) ||
        // did the function have arguments
        functionHadArguments(current)
    }

    _.extend(obj, {
      name: 'assert',
      // end:      true
      // snapshot: true
      message,
      passed,
      selector: value ? value.selector : undefined,
      timeout: 0,
      type (current, subject) {
        // if our current command has arguments assume
        // we are an assertion that's involving the current
        // subject or our value is the current subject
        return isChildLike(subject, current) ? 'child' : 'parent'
      },

      consoleProps: () => {
        obj = { Command: 'assert' }

        _.extend(obj, parseValueActualAndExpected(value, actual, expected))

        return _.extend(obj,
          { Message: message.replace(bTagOpen, '').replace(bTagClosed, '') })
      },
    })

    // think about completely gutting the whole object toString
    // which chai does by default, its so ugly and worthless

    if (error) {
      error.onFail = (err) => { }
    }

    Cypress.log(obj)

    return null
  }

  const finishAssertions = (assertions) => {
    return _.each(assertions, (log) => {
      log.snapshot()

      const e = log.get('_error')

      if (e) {
        return log.error(e)
      }

      return log.end()
    })
  }

  type VerifyUpcomingAssertionsCallbacks = {
    ensureExistenceFor?: 'subject' | 'dom' | boolean
    onPass?: Function
    onFail?: (err?, isDefaultAssertionErr?: boolean, cmds?: any[]) => void
    onRetry?: () => any
  }

  return {
    finishAssertions,

    // TODO: define the specific type of options
    verifyUpcomingAssertions (subject, options: Record<string, any> = {}, callbacks: VerifyUpcomingAssertionsCallbacks = {}) {
      const cmds = getUpcomingAssertions()

      cy.state('upcomingAssertions', cmds)

      // we're applying the default assertion in the
      // case where there are no upcoming assertion commands
      const isDefaultAssertionErr = cmds.length === 0

      if (options.assertions == null) {
        options.assertions = []
      }

      _.defaults(callbacks, {
        ensureExistenceFor: 'dom',
      })

      const ensureExistence = () => {
        // by default, ensure existence for dom subjects,
        // but not non-dom subjects
        switch (callbacks.ensureExistenceFor) {
          case 'dom': {
            const $el = determineEl(options.$el, subject)

            if (!$dom.isJquery($el)) {
              return
            }

            return cy.ensureElExistence($el)
          }
          case 'subject':
            return cy.ensureExistence(subject)

          default:
            return
        }
      }

      const determineEl = ($el, subject) => {
        // prefer $el unless it is strickly undefined
        if (!_.isUndefined($el)) {
          return $el
        }

        return subject
      }

      const onPassFn = () => {
        cy.state('overrideAssert', undefined)
        if (_.isFunction(callbacks.onPass)) {
          return callbacks.onPass.call(this, cmds, options.assertions)
        }

        return subject
      }

      const onFailFn = (err) => {
        // when we fail for whatever reason we need to
        // check to see if we would firstly fail if
        // we don't have an el in existence. what this
        // catches are assertions downstream about an
        // elements existence but the element never
        // exists in the first place. this will probably
        // ensure the error is about existence not about
        // the downstream assertion.
        try {
          ensureExistence()
        } catch (e2) {
          err = e2
        }

        cy.state('overrideAssert', undefined)
        err.isDefaultAssertionErr = isDefaultAssertionErr

        options.error = err

        if (err.retry === false) {
          throw err
        }

        const { onFail, onRetry } = callbacks

        if (!onFail && !onRetry) {
          throw err
        }

        // if our onFail throws then capture it
        // and finish the assertions and then throw
        // it again
        try {
          if (_.isFunction(onFail)) {
            // pass in the err and the upcoming assertion commands
            onFail.call(this, err, isDefaultAssertionErr, cmds)
          }
        } catch (e3) {
          finishAssertions(options.assertions)
          throw e3
        }

        if (_.isFunction(onRetry)) {
          return cy.retry(onRetry, options)
        }

        return
      }

      // bail if we have no assertions and apply
      // the default assertions if applicable
      if (!cmds.length) {
        // In general in cypress, when assertions fail we want to take a DOM
        // snapshot to display to the user. In this case though, when we invoke
        // ensureExistence, we're not going to display the error (if there is
        // one) to the user - we're only deciding whether to resolve this current
        // command (assertions pass) or fail (and probably retry). A DOM snapshot
        // isn't necessary in either case - one will be taken later as part of the
        // command (if they pass) or when we time out retrying.

        // Chai assertions have a signature of (passed, message, value, actual,
        // expected, error). Our assertFn, defined earlier in the file, adds
        // on a 7th arg, "verifying", which defaults to false. We here override
        // the assert function with our own, which just invokes the old one
        // with verifying = true. This override is cleaned up immediately
        // afterwards, in either onPassFn or onFailFn.
        cy.state('overrideAssert', function (...args) {
          return assertFn.apply(this, args.concat(true) as any)
        })

        return Promise
        .try(ensureExistence)
        .then(onPassFn)
        .catch(onFailFn)
      }

      let i = 0

      const cmdHasFunctionArg = (cmd) => {
        return _.isFunction(cmd.get('args')[0])
      }

      const overrideAssert = function (...args) {
        let cmd = cmds[i]
        const setCommandLog = (log) => {
          // our next log may not be an assertion
          // due to page events so make sure we wait
          // until we see page events
          if (log.get('name') !== 'assert') {
            return
          }

          // when we do immediately unbind this function
          cy.state('onBeforeLog', null)

          const insertNewLog = (log) => {
            cmd.log(log)

            return options.assertions.push(log)
          }

          // its possible a single 'should' will assert multiple
          // things such as the case with have.property. we can
          // detect when that is happening because cmd will be null.
          // if thats the case then just set cmd to be the previous
          // cmd and do not increase 'i'
          // this will prevent 2 logs from ever showing up but still
          // provide errors when the 1st assertion fails.
          if (!cmd) {
            cmd = cmds[i - 1]
          } else {
            i += 1
          }

          // if our command has a function argument
          // then we know it may contain multiple
          // assertions
          if (cmdHasFunctionArg(cmd)) {
            let index = cmd.get('assertionIndex')
            let assertions = cmd.get('assertions')

            // https://github.com/cypress-io/cypress/issues/4981
            // `assertions` is undefined because assertions added by
            // `should` command are not handled yet.
            // So, don't increase i and go back to the last command.
            if (!assertions) {
              i -= 1
              cmd = cmds[i - 1]
              index = cmd.get('assertionIndex')
              assertions = cmd.get('assertions')
            }

            // always increase the assertionIndex
            // so our next assertion matches up
            // to the correct index
            const incrementIndex = () => {
              return cmd.set('assertionIndex', index += 1)
            }

            // if we dont have an assertion at this
            // index then insert a new log
            const assertion = assertions[index]

            if (!assertion) {
              assertions.push(log)
              incrementIndex()

              return insertNewLog(log)
            }

            // else just merge this log
            // into the previous assertion log
            incrementIndex()
            assertion.merge(log)

            // dont output a new log
            return false
          }

          // if we already have a log
          // then just update its attrs from
          // the new log
          const l = cmd.getLastLog()

          if (l) {
            l.merge(log)

            // and make sure we return false
            // which prevents a new log from
            // being added
            return false
          }

          return insertNewLog(log)
        }

        cy.state('onBeforeLog', setCommandLog)

        // send verify=true as the last arg
        return assertFn.apply(this, args.concat(true) as any)
      }

      const fns = injectAssertionFns(cmds)

      // TODO: remove any when the type of subject, the first argument of this function is specified.
      const subjects: any[] = []

      // iterate through each subject
      // and force the assertion to return
      // this value so it does not get
      // invoked again
      const setSubjectAndSkip = () => {
        subjects.forEach((subject, i) => {
          const cmd = cmds[i]

          cmd.set('subject', subject)
          cmd.skip()
        })

        return cmds
      }

      const assertions = (memo, fn, i) => {
        // HACK: bluebird .reduce will not call the callback
        // if given an undefined initial value, so in order to
        // support undefined subjects, we wrap the initial value
        // in an Array and unwrap it if index = 0
        if (i === 0) {
          memo = memo[0]
        }

        return fn(memo).then((subject) => {
          return subjects[i] = subject
        })
      }

      const restore = () => {
        cy.state('upcomingAssertions', [])

        // no matter what we need to
        // restore the assert fn
        return cy.state('overrideAssert', undefined)
      }

      cy.state('overrideAssert', overrideAssert)

      return Promise
      .reduce(fns, assertions, [subject])
      .then(() => {
        restore()

        setSubjectAndSkip()

        finishAssertions(options.assertions)

        return onPassFn()
      })
      .catch((err) => {
        restore()

        // when we're told not to retry
        if (err.retry === false) {
          // finish the assertions
          finishAssertions(options.assertions)

          // and then push our command into this err
          try {
            $errUtils.throwErr(err, { onFail: options._log })
          } catch (e) {
            err = e
          }
        }

        throw err
      })
      .catch(onFailFn)
    },

    assert (...args) {
      // if we've temporarily overridden assertions
      // then just bail early with this function
      const fn = cy.state('overrideAssert') || assertFn

      return fn.apply(this, args)
    },
  }
}

export interface IAssertions {
  verifyUpcomingAssertions: ReturnType<typeof create>['verifyUpcomingAssertions']
  assert: ReturnType<typeof create>['assert']
}
