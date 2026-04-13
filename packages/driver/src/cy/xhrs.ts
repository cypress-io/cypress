import $errUtils from '../cypress/error_utils'
import type { StateFunc } from '../cypress/state'

const xhrNotWaitedOnByIndex = (state: StateFunc, alias: string, index: number, prop: 'requests' | 'responses') => {
  // find the last request or response
  // which hasnt already been used.
  let xhrs = state(prop) || []

  xhrs = xhrs.filter((xhr) => xhr.alias === alias)

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

    if (alias.indexOf('.') === -1) {
      str = alias
      prop = null
    } else {
      const allParts = alias.split('.')

      str = allParts.slice(0, -1).join('.')
      prop = allParts.at(-1)
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
