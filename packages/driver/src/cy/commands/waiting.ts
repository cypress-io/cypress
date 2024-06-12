import _ from 'lodash'
import Promise from 'bluebird'
import { waitForRoute } from '../net-stubbing/wait-for-route'
import { isDynamicAliasingPossible } from '../net-stubbing/aliasing'
import ordinal from 'ordinal'

import $errUtils from '../../cypress/error_utils'

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

type Alias = {
  name: string
  cardinal: number
  ordinal: number
}

export default (Commands, Cypress, cy, state) => {
  const waitNumber = (subject, ms, options) => {
    // increase the timeout by the delta
    cy.timeout(ms, true, 'wait')

    options._log = Cypress.log({
      hidden: options.log === false,
      timeout: ms,
      consoleProps () {
        return {
          'Waited For': `${ms}ms before continuing`,
          'Yielded': subject,
        }
      },
    })

    return Promise
    .delay(ms, 'wait')
    .return(subject)
  }

  const waitString = (subject, str, options) => {
    // if this came from the spec bridge, we need to set a few additional properties to ensure the log displays correctly
    // otherwise, these props will be pulled from the current command which will be cy.origin on the primary
    const log = options._log = Cypress.log({
      hidden: options.log === false,
      type: 'parent',
      aliasType: 'route',
      // avoid circular reference
      options: _.omit(options, '_log'),
    })

    if (options.isCrossOriginSpecBridge) {
      log?.set({
        name: 'wait',
        message: '',
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
        // Attach alias to request to ensure driver access to
        // dynamic aliases. See #24653
        req.request.alias = alias

        return req
      }

      // append .type to the alias
      const xhr = cy.getIndexedXhrByAlias(`${alias}.${type}`, index)

      // return our xhr object
      if (xhr) {
        return xhr
      }

      const args: [any, any, any, any, any] = [alias, type, index, num, options]

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
        // potentially request, response
        const allParts = _.split(str, '.')
        const last = _.last(allParts)

        if (last === 'request' || last === 'response') {
          str = _.join(_.dropRight(allParts, 1), '.')
          specifier = _.last(allParts)
        } else {
          specifier = null
        }
      }

      let aliasObj

      try {
        aliasObj = cy.getAlias(str, 'wait', log)
      } catch (err) {
        // before cy.intercept, we could know when an alias did/did not exist, because they
        // were declared synchronously. with cy.intercept, req.alias can be used to dynamically
        // create aliases, so we cannot know at wait-time if an alias exists or not
        if (!isDynamicAliasingPossible(state)) {
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
        const aliases: Array<Alias> = [].concat(referencesAlias)

        if (str) {
          aliases.push({
            name: str,
            cardinal: index + 1,
            ordinal: num,
          })
        }

        log.set('referencesAlias', aliases)
      }

      const isNetworkInterceptCommand = (command) => {
        const commandsThatCreateNetworkIntercepts = ['route', 'intercept']
        const commandName = command.get('name')

        return commandsThatCreateNetworkIntercepts.includes(commandName)
      }

      const findInterceptAlias = (alias) => {
        const routes = cy.state('routes') || {}

        return _.find(_.values(routes), { alias })
      }

      const isInterceptAlias = (alias) => Boolean(findInterceptAlias(alias))

      if (command && !isNetworkInterceptCommand(command)) {
        if (!isInterceptAlias(alias)) {
          $errUtils.throwErrByPath('wait.invalid_alias', {
            onFail: options._log,
            args: { alias },
          })
        }
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
      const ret = responses.length === 1 ? responses[0] : ((resp) => {
        const respMap = new Map()
        const respSeq = resp.map((r) => r.routeId)

        // responses are sorted in the order the user specified them. if there are multiples of the same
        // alias awaited, they're sorted in execution order
        resp.sort((a, b) => {
          if (!a.browserRequestId || !b.browserRequestId) {
            return 0
          }

          // sort responses based on browser request ID
          const requestIdSuffixA = a.browserRequestId.split('.').length > 1 ? a.browserRequestId.split('.')[1] : a.browserRequestId
          const requestIdSuffixB = b.browserRequestId.split('.').length > 1 ? b.browserRequestId.split('.')[1] : b.browserRequestId

          return parseInt(requestIdSuffixA) < parseInt(requestIdSuffixB) ? -1 : 1
        }).forEach((r) => {
          respMap.get(r.routeId)?.push(r) ?? respMap.set(r.routeId, [r])
        })

        return respSeq.map((routeId) => respMap.get(routeId)?.shift())
      })(responses)

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

  Cypress.primaryOriginCommunicator.on('wait:for:xhr', ({ args: [str, options] }, { origin }) => {
    options.isCrossOriginSpecBridge = true
    waitString(null, str, options).then((responses) => {
      Cypress.primaryOriginCommunicator.toSpecBridge(origin, 'wait:for:xhr:end', responses)
    }).catch((err) => {
      options._log?.error(err)
      err.hasSpecBridgeError = true
      Cypress.primaryOriginCommunicator.toSpecBridge(origin, 'wait:for:xhr:end', err)
    })
  })

  const delegateToPrimaryOrigin = ([_subject, str, options]) => {
    return new Promise((resolve, reject) => {
      Cypress.specBridgeCommunicator.once('wait:for:xhr:end', (responsesOrErr) => {
        // determine if this is an error by checking if there is a spec bridge error
        if (responsesOrErr.hasSpecBridgeError) {
          delete responsesOrErr.hasSpecBridgeError
          if (options.log) {
            // skip this 'wait' log since it was already added through the primary
            Cypress.state('onBeforeLog', (log) => {
              if (log.get('name') === 'wait') {
                // unbind this function so we don't impact any other logs
                cy.state('onBeforeLog', null)

                return false
              }

              return true
            })
          }

          reject(responsesOrErr)
        }

        resolve(responsesOrErr)
      })

      // subject is not needed when waiting on aliased requests since the request/response will be yielded
      Cypress.specBridgeCommunicator.toPrimary('wait:for:xhr', { args: [str, options] })
    })
  }

  Commands.addAll({ prevSubject: 'optional' }, {
    wait (subject, msOrAlias, options: { log?: boolean } = {}) {
      // check to ensure options is an object
      // if its a string the user most likely is trying
      // to wait on multiple aliases and forget to make this
      // an array
      if (_.isString(options)) {
        $errUtils.throwErrByPath('wait.invalid_arguments')
      }

      if (_.isFunction(options)) {
        $errUtils.throwErrByPath('wait.invalid_arguments_function')
      }

      options = _.defaults({}, options, { log: true })
      const args: any = [subject, msOrAlias, options]

      try {
        if (_.isFinite(msOrAlias)) {
          return waitNumber.apply(window, args)
        }

        if (_.isString(msOrAlias) || (_.isArray(msOrAlias) && !_.isEmpty(msOrAlias))) {
          if (Cypress.isCrossOriginSpecBridge) {
            return delegateToPrimaryOrigin(args)
          }

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
      } catch (err: any) {
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
