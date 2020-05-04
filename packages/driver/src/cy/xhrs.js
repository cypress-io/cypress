/* globals cy */
const _ = require('lodash')

const $errUtils = require('../cypress/error_utils')

const validAliasApiRe = /^(\d+|all)$/

const xhrNotWaitedOnByIndex = (state, alias, index, prop) => {
  // find the last request or response
  // which hasnt already been used.
  let xhrs = state(prop) || []

  xhrs = _.filter(xhrs, { alias })

  // allow us to handle waiting on both
  // the request or the response part of the xhr
  const privateProp = `_has${prop}BeenWaitedOn`

  const obj = xhrs[index]

  if (obj && !obj[privateProp]) {
    obj[privateProp] = true

    return obj.xhr
  }
}

const create = (state) => {
  return {
    getIndexedXhrByAlias (alias, index) {
      let prop
      let str

      if (_.indexOf(alias, '.') === -1) {
        str = alias
        prop = null
      } else {
        const allParts = _.split(alias, '.')

        str = _.join(_.dropRight(allParts, 1), '.')
        prop = _.last(allParts)
      }

      if (prop) {
        if (prop === 'request') {
          return xhrNotWaitedOnByIndex(state, str, index, 'requests')
        }

        if (prop !== 'response') {
          $errUtils.throwErrByPath('wait.alias_invalid', {
            args: { prop, str },
          })
        }
      }

      return xhrNotWaitedOnByIndex(state, str, index, 'responses')
    },

    getRequestsByAlias (alias) {
      let prop

      if (_.indexOf(alias, '.') === -1 || _.keys(cy.state('aliases')).includes(alias)) {
        prop = null
      } else {
        // potentially valid prop
        const allParts = _.split(alias, '.')

        alias = _.join(_.dropRight(allParts, 1), '.')
        prop = _.last(allParts)
      }

      if (prop && !validAliasApiRe.test(prop)) {
        $errUtils.throwErrByPath('get.alias_invalid', {
          args: { prop },
        })
      }

      if (prop === '0') {
        $errUtils.throwErrByPath('get.alias_zero', {
          args: { alias },
        })
      }

      // return an array of xhrs
      const matching = _
      .chain(state('responses'))
      .filter({ alias })
      .map('xhr')
      .value()

      // return the whole array if prop is all
      if (prop === 'all') {
        return matching
      }

      // else if prop its a digit and we need to return
      // the 1-based response from the array
      if (prop) {
        return matching[_.toNumber(prop) - 1]
      }

      // else return the last matching response
      return _.last(matching)
    },
  }
}

module.exports = {
  create,
}
