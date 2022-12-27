import type { $Cy } from '../cypress/cy'
import $errUtils from '../cypress/error_utils'

export const handleUnsupportedAPIs = (Cypress: Cypress.Cypress, cy: $Cy) => {
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
