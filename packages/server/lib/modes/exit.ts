import { toNumber } from 'lodash'
import Promise from 'bluebird'

export = (options) => {
  return Promise.try(() => {
    return toNumber(options.exitWithCode)
  })
}
