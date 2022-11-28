import _ from 'lodash'
import $ from 'jquery'
import Promise from 'bluebird'

import $errUtils from '../../cypress/error_utils'
import type { Log } from '../../cypress/log'

const ngPrefixes = ['ng-', 'ng_', 'data-ng-', 'x-ng-']

interface InternalNgOptions extends Partial<Cypress.Loggable & Cypress.Timeoutable> {
  _log?: Log
}

export default (Commands, Cypress, cy, state) => {
  const findByNgBinding = (binding, options) => {
    const selector = '.ng-binding'

    const { angular } = state('window')

    _.extend(options, { verify: false, log: false })

    const getEl = ($elements) => {
      const filtered = $elements.filter((index, el) => {
        const dataBinding = angular.element(el).data('$binding')

        if (dataBinding) {
          const bindingName = dataBinding.exp || dataBinding[0].exp || dataBinding

          return bindingName.includes(binding)
        }
      })

      // if we have items return
      // those filtered items
      if (filtered.length) {
        return filtered
      }

      // else return null element
      return $(null as any) // cast to any to satisfy typescript
    }

    const resolveElements = () => {
      return cy.now('get', selector, options).then(($elements) => {
        return cy.verifyUpcomingAssertions(getEl($elements), options, {
          onRetry: resolveElements,
          onFail (err) {
            err.message = `Could not find element for binding: '${binding}'.`
          },
        })
      })
    }

    return resolveElements()
  }

  const findByNgAttr = (name, attr, el, options) => {
    const selectors: string[] = []
    let error = `Could not find element for ${name}: '${el}'.  Searched `

    _.extend(options, { verify: false, log: false })

    const finds = _.map(ngPrefixes, (prefix) => {
      const selector = `[${prefix}${attr}'${el}']`

      selectors.push(selector)

      const resolveElements = () => {
        return cy.now('get', selector, options).then(($elements) => {
          return cy.verifyUpcomingAssertions($elements, options, {
            onRetry: resolveElements,
          })
        })
      }

      return resolveElements()
    })

    error += `${selectors.join(', ')}.`

    const cancelAll = () => {
      return _.invokeMap(finds, 'cancel')
    }

    return Promise
    .any(finds)
    .then((subject) => {
      cancelAll()

      return subject
    }).catch(Promise.AggregateError, () => {
      return $errUtils.throwErr(error)
    })
  }

  Commands.addAll({
    ng (type: string, selector: string, userOptions: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
      // what about requirejs / browserify?
      // we need to intelligently check to see if we're using those
      // and if angular is available through them.  throw a very specific
      // error message here that's different depending on what module
      // system you're using
      if (!state('window').angular) {
        $errUtils.throwErrByPath('ng.no_global')
      }

      const options: InternalNgOptions = _.defaults({}, userOptions, { log: true })

      if (options.log) {
        options._log = Cypress.log({
          timeout: options.timeout,
        })
      }

      switch (type) {
        case 'model':
          return findByNgAttr('model', 'model=', selector, options)
        case 'repeater':
          return findByNgAttr('repeater', 'repeat*=', selector, options)
        case 'binding':
          return findByNgBinding(selector, options)
        default:
          return
      }
    },
  })
}
