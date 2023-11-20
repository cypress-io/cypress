import _ from 'lodash'

import $errUtils from '../cypress/error_utils'
import type { StateFunc } from '../cypress/state'

const xhrNotWaitedOnByIndex = (state: StateFunc, alias: string, index: number, prop: 'requests' | 'responses') => {
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

// eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
export const create = (state: StateFunc) => ({
  getIndexedXhrByAlias (alias: string, index: number) {
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
})

export interface IXhr extends ReturnType<typeof create> {}
