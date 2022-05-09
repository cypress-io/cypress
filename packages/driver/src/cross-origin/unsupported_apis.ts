import type { $Cy } from '../cypress/cy'
import $errUtils from '../cypress/error_utils'

export const handleUnsupportedAPIs = (Cypress: Cypress.Cypress, cy: $Cy) => {
  // The following commands/methods are not supported within the `origin`
  // callback since they are deprecated
  // @ts-ignore
  cy.route = () => $errUtils.throwErrByPath('origin.unsupported.route')
  // @ts-ignore
  cy.server = () => $errUtils.throwErrByPath('origin.unsupported.server')
  Cypress.Server = new Proxy(Cypress.Server, {
    get: () => $errUtils.throwErrByPath('origin.unsupported.Server'),
    // @ts-ignore
    set: () => $errUtils.throwErrByPath('origin.unsupported.Server'),
  })

  // @ts-ignore
  Cypress.Cookies.preserveOnce = () => $errUtils.throwErrByPath('origin.unsupported.Cookies_preserveOnce')

  // Nested `origin` is not currently supported, but will be in the future
  // @ts-ignore
  cy.origin = () => $errUtils.throwErrByPath('origin.unsupported.origin')

  // `intercept` and `session` are not supported within the `origin`
  // callback, but can be used outside of it for the same effect. It's unlikely
  // they will ever be supported unless we discover uses-cases that require it
  // @ts-ignore
  cy.intercept = () => $errUtils.throwErrByPath('origin.unsupported.intercept')
  // @ts-ignore
  cy.session = () => $errUtils.throwErrByPath('origin.unsupported.session')
  // @ts-ignore
  Cypress.session = new Proxy(Cypress.session, {
    get: () => $errUtils.throwErrByPath('origin.unsupported.Cypress_session'),
    // @ts-ignore
    set: () => $errUtils.throwErrByPath('origin.unsupported.Cypress_session'),
  })
}
