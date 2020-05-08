const _ = require('lodash')
const Promise = require('bluebird')
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
  const waitFunction = () => {
    $errUtils.throwErrByPath('wait.fn_deprecated')
  }

  let userOptions = null

  const waitNumber = (subject, ms, options) => {
    // increase the timeout by the delta
    cy.timeout(ms, true, 'wait')

    if (options.log !== false) {
      options._log = Cypress.log({
        options: userOptions,
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

    const checkForXhr = function (alias, type, index, num, options) {
      options.type = type

      // append .type to the alias
      const xhr = cy.getIndexedXhrByAlias(`${alias}.${type}`, index)

      // return our xhr object
      if (xhr) {
        return Promise.resolve(xhr)
      }

      options.error = $errUtils.errByPath('wait.timed_out', {
        timeout: options.timeout,
        alias,
        num,
        type,
      }).message

      const args = [alias, type, index, num, options]

      return cy.retry(() => {
        return checkForXhr.apply(window, args)
      }, options)
    }

    const waitForXhr = function (str, options) {
      let str2

      // we always want to strip everything after the last '.'
      // since we support alias property 'request'
      if ((_.indexOf(str, '.') === -1) ||
      _.keys(cy.state('aliases')).includes(str.slice(1))) {
        str2 = null
      } else {
        // potentially request, response or index
        const allParts = _.split(str, '.')

        str = _.join(_.dropRight(allParts, 1), '.')
        str2 = _.last(allParts)
      }

      const aliasObj = cy.getAlias(str, 'wait', log)

      if (!aliasObj) {
        cy.aliasNotFoundFor(str, 'wait', log)
      }

      // if this alias is for a route then poll
      // until we find the response xhr object
      // by its alias
      const { alias, command } = aliasObj

      str = _.compact([alias, str2]).join('.')

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

      if (command.get('name') !== 'route') {
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

        return checkForXhr(alias, 'request', index, num, options)
      }

      const waitForResponse = () => {
        options = _.omit(options, '_runnableTimeout')
        options.timeout = responseTimeout || Cypress.config('responseTimeout')

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
    wait (subject, msOrFnOrAlias, options = {}) {
      userOptions = options

      // check to ensure options is an object
      // if its a string the user most likely is trying
      // to wait on multiple aliases and forget to make this
      // an array
      if (_.isString(userOptions)) {
        $errUtils.throwErrByPath('wait.invalid_arguments')
      }

      options = _.defaults({}, userOptions, { log: true })
      const args = [subject, msOrFnOrAlias, options]

      try {
        if (_.isFinite(msOrFnOrAlias)) {
          return waitNumber.apply(window, args)
        }

        if (_.isFunction(msOrFnOrAlias)) {
          return waitFunction()
        }

        if (_.isString(msOrFnOrAlias)) {
          return waitString.apply(window, args)
        }

        if (_.isArray(msOrFnOrAlias) && !_.isEmpty(msOrFnOrAlias)) {
          return waitString.apply(window, args)
        }

        // figure out why this error failed
        if (_.isNaN(msOrFnOrAlias)) {
          throwErr('NaN')
        }

        if (msOrFnOrAlias === Infinity) {
          throwErr('Infinity')
        }

        if (_.isSymbol(msOrFnOrAlias)) {
          throwErr(msOrFnOrAlias.toString())
        }

        let arg

        try {
          arg = JSON.stringify(msOrFnOrAlias)
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
