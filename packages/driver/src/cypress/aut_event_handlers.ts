import $errUtils from './error_utils'
import { $Location } from './location'

const setupAutEventHandlers = (Cypress) => {
  // This message comes from the AUT, not the spec bridge.
  // This error is forwarded from a cross origin AUT prior to attaching a spec bridge.
  Cypress.primaryOriginCommunicator.on('aut:throw:error', ({ message, stack, href }) => {
    const error = $errUtils.errByPath('origin.aut_error_prior_to_spec_bridge_attach', {
      ...(stack && { stack }),
      args: {
        errorMessage: message,
        autLocation: $Location.create(href),
      },
    })

    error.name = 'Error'
    throw error
  })
}

export { setupAutEventHandlers }
