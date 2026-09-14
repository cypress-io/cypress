import $errUtils from './error_utils'

// override the defaults for all servers
export const defaults = (obj = {}) => {
  return $errUtils.throwErrByPath('server.removed', { args: { cmd: 'Cypress.Server.defaults' } })
}

// Kept so `Cypress.Server.defaults()` throws a message pointing at cy.intercept
// rather than a bare TypeError.
export default {
  defaults,
}
