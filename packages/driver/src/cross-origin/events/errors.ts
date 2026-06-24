import type { $Cy } from '../../cypress/cy'
import $errUtils, { ErrorFromProjectRejectionEvent } from '../../cypress/error_utils'
import type { HandlerType } from '../../cypress/runner'

export const handleErrorEvent = (cy: $Cy, frameType: 'spec' | 'app') => {
  return (handlerType: HandlerType) => {
    return (event) => {
      const { originalErr, err, promise } = $errUtils.errorFromUncaughtEvent(handlerType, event) as ErrorFromProjectRejectionEvent
      const handled = cy.onUncaughtException({
        err,
        promise,
        handlerType,
        frameType,
      })

      $errUtils.logError(Cypress, handlerType, originalErr, handled)

      if (!handled) {
        // if unhandled, fail the current command to fail the current test in the primary origin
        // a current command may not exist if an error occurs in the spec bridge after the test is over
        const command = cy.state('current')
        const log = command?.getLastLog()

        if (log) log.error(err)
      }

      // return undefined so the browser does its default
      // uncaught exception behavior (logging to console)
      return undefined
    }
  }
}
