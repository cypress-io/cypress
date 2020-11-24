const _ = require('lodash')
const Promise = require('bluebird')
const { waitForRoute } = require('../net-stubbing')
const ordinal = require('ordinal')

const $errUtils = require('../../cypress/error_utils')

const getNumRequests = (state, alias) => {
  const requests = state('aliasRequests') || {}

  requests[alias] = requests[alias] || 0

  const index = requests[alias]

  requests[alias] += 1

  state('aliasRequests', requests)

  return [index, ordinal(requests[alias])]
}

const throwErr = (arg) => {
  $errUtils.throwErrByPath('wait.invalid_1st_arg', { args: { arg } })
}

module.exports = (Commands, Cypress, cy, state) => {
  const isDynamicAliasingPossible = () => {
    // dynamic aliasing is possible if a route with dynamic interception has been defined
    return _.find(state('routes'), (route) => {
      return _.isFunction(route.handler)
    })
  }

  let userOptions = null

  const waitNumber = (subject, ms, options) => {
    // increase the timeout by the delta
    cy.timeout(ms, true, 'wait')

    if (options.log !== false) {
      options._log = Cypress.log({
        timeout: ms,
        consoleProps () {
          return {
            'Waited For': `${ms}ms before continuing`,
            'Yielded': subject,
          }
        },
      })
    }

    return Promise
    .delay(ms, 'wait')
    .return(subject)
  }

  const waitString = (subject, str, options) => {
    let log

    if (options.log !== false) {
      log = options._log = Cypress.log({
        type: 'parent',
        aliasType: 'route',
        options: userOptions,
      })
    }

    const checkForXhr = async function (alias, type, index, num, options) {
      options.error = $errUtils.errByPath('wait.timed_out', {
        timeout: options.timeout,
        alias,
        num,
        type,
      })

      options.type = type

      // check cy.intercept routes
      const req = waitForRoute(alias, state, type)

      if (req) {
        return req
      }

      // append .type to the alias
      const xhr = cy.getIndexedXhrByAlias(`${alias}.${type}`, index)

      // return our xhr object
      if (xhr) {
        return xhr
      }

      const args = [alias, type, index, num, options]

      return cy.retry(() => {
        return checkForXhr.apply(window, args)
      }, options)
    }

    const waitForXhr = function (str, options) {
      let specifier

      // we always want to strip everything after the last '.'
      // since we support alias property 'request'
      if ((_.indexOf(str, '.') === -1) ||
      _.keys(cy.state('aliases')).includes(str.slice(1))) {
        specifier = null
      } else {
        // potentially request, response or index
        const allParts = _.split(str, '.')

        str = _.join(_.dropRight(allParts, 1), '.')
        specifier = _.last(allParts)
      }

      let aliasObj

      try {
        aliasObj = cy.getAlias(str, 'wait', log)
      } catch (err) {
        // before cy.intercept, we could know when an alias did/did not exist, because they
        // were declared synchronously. with cy.intercept, req.alias can be used to dynamically
        // create aliases, so we cannot know at wait-time if an alias exists or not
        if (!isDynamicAliasingPossible()) {
          throw err
        }

        // could be a dynamic alias
        aliasObj = { alias: str.slice(1) }
      }

      if (!aliasObj) {
        cy.aliasNotFoundFor(str, 'wait', log)
      }

      // if this alias is for a route then poll
      // until we find the response xhr object
      // by its alias
      const { alias, command } = aliasObj

      str = _.compact([alias, specifier]).join('.')

      const type = cy.getXhrTypeByAlias(str)

      const [index, num] = getNumRequests(state, alias)

      // if we have a command then continue to
      // build up an array of referencesAlias
      // because wait can reference an array of aliases
      if (log) {
        const referencesAlias = log.get('referencesAlias') || []
        const aliases = [].concat(referencesAlias)

        if (str) {
          aliases.push({
            name: str,
            cardinal: index + 1,
            ordinal: num,
          })
        }

        log.set('referencesAlias', aliases)
      }

      if (command && !['route', 'route2', 'intercept'].includes(command.get('name'))) {
        $errUtils.throwErrByPath('wait.invalid_alias', {
          onFail: options._log,
          args: { alias },
        })
      }

      // create shallow copy of each options object
      // but slice out the error since we may set
      // the error related to a previous xhr
      const { timeout } = options
      const requestTimeout = options.requestTimeout || timeout
      const responseTimeout = options.responseTimeout || timeout

      const waitForRequest = () => {
        options = _.omit(options, '_runnableTimeout')
        options.timeout = requestTimeout || Cypress.config('requestTimeout')

        if (log) {
          log.set('timeout', options.timeout)
        }

        return checkForXhr(alias, 'request', index, num, options)
      }

      const waitForResponse = () => {
        options = _.omit(options, '_runnableTimeout')
        options.timeout = responseTimeout || Cypress.config('responseTimeout')

        if (log) {
          log.set('timeout', options.timeout)
        }

        return checkForXhr(alias, 'response', index, num, options)
      }

      // if we were only waiting for the request
      // then resolve immediately do not wait for response
      if (type === 'request') {
        return waitForRequest()
      }

      return waitForRequest().then(waitForResponse)
    }

    return Promise
    .map([].concat(str), (str) => {
      // we may get back an xhr value instead
      // of a promise, so we have to wrap this
      // in another promise :-(
      return waitForXhr(str, _.omit(options, 'error'))
    })
    .then((responses) => {
      // if we only asked to wait for one alias
      // then return that, else return the array of xhr responses
      const ret = responses.length === 1 ? responses[0] : responses

      if (log) {
        log.set('consoleProps', () => {
          return {
            'Waited For': (_.map(log.get('referencesAlias'), 'name') || []).join(', '),
            'Yielded': ret,
          }
        })

        log.snapshot().end()
      }

      return ret
    })
  }

  Commands.addAll({ prevSubject: 'optional' }, {
    wait (subject, msOrAlias, options = {}) {
      userOptions = options

      // check to ensure options is an object
      // if its a string the user most likely is trying
      // to wait on multiple aliases and forget to make this
      // an array
      if (_.isString(userOptions)) {
        $errUtils.throwErrByPath('wait.invalid_arguments')
      }

      options = _.defaults({}, userOptions, { log: true })
      const args = [subject, msOrAlias, options]

      try {
        if (_.isFinite(msOrAlias)) {
          return waitNumber.apply(window, args)
        }

        if (_.isString(msOrAlias)) {
          return waitString.apply(window, args)
        }

        if (_.isArray(msOrAlias) && !_.isEmpty(msOrAlias)) {
          return waitString.apply(window, args)
        }

        // figure out why this error failed
        if (_.isNaN(msOrAlias)) {
          throwErr('NaN')
        }

        if (msOrAlias === Infinity) {
          throwErr('Infinity')
        }

        if (_.isSymbol(msOrAlias)) {
          throwErr(msOrAlias.toString())
        }

        let arg

        try {
          arg = JSON.stringify(msOrAlias)
        } catch (error) {
          arg = 'an invalid argument'
        }

        return throwErr(arg)
      } catch (err) {
        if (err.name === 'CypressError') {
          throw err
        } else {
          // whatever was passed in could not be parsed
          // by our switch case
          return throwErr('an invalid argument')
        }
      }
    },
  })
}
