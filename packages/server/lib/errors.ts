import errors from '@packages/errors'
import Bluebird from 'bluebird'

const isProduction = () => {
  return process.env['CYPRESS_INTERNAL_ENV'] === 'production'
}

const logException = Bluebird.method(function (this: any, err) {
  // TODO: remove context here
  if (this.log(err) && isProduction()) {
    // log this exception since
    // its not a known error
    return require('./logger')
    .createException(err)
    .catch(() => {})
  }
})

const errorApi = {
  ...errors,
  logException,
}

export = errorApi
