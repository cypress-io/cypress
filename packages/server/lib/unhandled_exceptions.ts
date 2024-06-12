import Debug from 'debug'
const debug = Debug('cypress:server:unhandled_exceptions')

export function handle (shouldExitCb?: (err: Error) => boolean) {
  function globalExceptionHandler (err: Error) {
    if (shouldExitCb && !shouldExitCb(err)) {
      debug('suppressing unhandled exception, not exiting %o', { err })
      handle(shouldExitCb)

      return
    }

    process.exitCode = 1

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
