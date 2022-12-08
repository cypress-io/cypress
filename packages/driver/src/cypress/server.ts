import $errUtils from './error_utils'

// override the defaults for all servers
export const defaults = (obj = {}) => {
  return $errUtils.throwErrByPath('server.removed', { args: { cmd: 'Cypress.Server.defaults' } })
}

// Left behind for backwards compatibility
// When cy.server() is moved to a plugin, this might be safely removed.
export default {
  defaults,
}
