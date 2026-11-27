import Debug from 'debug'
import { wasConfigProcessExitReported } from './util/config_process_exit'
const debug = Debug('cypress:server:unhandled_exceptions')

export function handle (shouldExitCb?: (err: Error) => boolean) {
  function globalExceptionHandler (err: Error) {
    if (shouldExitCb && !shouldExitCb(err)) {
      debug('suppressing unhandled exception, not exiting %o', { err })
      handle(shouldExitCb)

      return
    }

    process.exitCode = 1

    // The graceful exit that reported the config process exit is running with code 1. Exiting here would cut
    // its teardown short, so this error (a consequence of that exit) is only logged for debugging.
    if (wasConfigProcessExitReported()) {
      debug('not exiting, a graceful exit is already in progress after the config process exit %o', { err })
      handle(shouldExitCb)

      return
    }

    return require('./errors').logException(err)
    .then(() => {
      process.exit(1)
    })
  }

  process.removeAllListeners('unhandledRejection')
  process.once('unhandledRejection', globalExceptionHandler)
  process.removeAllListeners('uncaughtException')
  process.once('uncaughtException', globalExceptionHandler)
}
