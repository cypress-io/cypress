import Bluebird from 'bluebird'
import errors from '@packages/errors'
import exception from './cloud/exception'
import { wasConfigProcessExitReported } from './util/config_process_exit'

const isProduction = () => {
  return process.env['CYPRESS_INTERNAL_ENV'] === 'production'
}

export const logException = Bluebird.method(function (this: any, err) {
  if (wasConfigProcessExitReported()) {
    return
  }

  // TODO: remove context here
  if (this.log(err) && isProduction()) {
    // log this exception since
    // its not a known error
    return exception
    .create(err)
    .catch(() => {})
  }

  return
})

export const get = errors.get

export const log = errors.log

export const warning = errors.warning

export const throwErr = errors.throwErr

export const cloneErr = errors.cloneErr
