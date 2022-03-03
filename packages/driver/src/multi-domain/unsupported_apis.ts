import type { $Cy } from '../cypress/cy'
import $errUtils from '../cypress/error_utils'

export const handleUnsupportedAPIs = (Cypress: Cypress.Cypress, cy: $Cy) => {
  // outlaw the use of `route` and `server` within the multi-domain context and Cypress.Server.* configurations
  // @ts-ignore
  cy.route = () => $errUtils.throwErrByPath('switchToDomain.route.unsupported')
  // @ts-ignore
  cy.server = () => $errUtils.throwErrByPath('switchToDomain.server.unsupported')
  Cypress.Server = new Proxy(Cypress.Server, {
    get: () => $errUtils.throwErrByPath('switchToDomain.Server.unsupported'),
    // @ts-ignore
    set: () => $errUtils.throwErrByPath('switchToDomain.Server.unsupported'),
  })

  // outlaw the use of Cypress.Cookies.* configurations, but allow other cy cookies methods to be used
  // @ts-ignore
  Cypress.Cookies.preserveOnce = () => $errUtils.throwErrByPath('switchToDomain.Cookies.preserveOnce.unsupported')
}
