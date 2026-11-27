import type { $Cy } from '../cypress/cy'
import $errUtils from '../cypress/error_utils'

export const handleUnsupportedAPIs = (Cypress: Cypress.Cypress, cy: $Cy) => {
  // Nested `origin` is not currently supported, but will be in the future
  // @ts-expect-error - $Cy does not declare origin
  cy.origin = () => $errUtils.throwErrByPath('origin.unsupported.origin')

  // `intercept` and `session` are not supported within the `origin`
  // callback, but can be used outside of it for the same effect. It's unlikely
  // they will ever be supported unless we discover uses-cases that require it
  // @ts-expect-error - $Cy does not declare intercept
  cy.intercept = () => $errUtils.throwErrByPath('origin.unsupported.intercept')
  // @ts-expect-error - $Cy does not declare session
  cy.session = () => $errUtils.throwErrByPath('origin.unsupported.session')
  Cypress.session = new Proxy(Cypress.session, {
    get: () => $errUtils.throwErrByPath('origin.unsupported.Cypress_session'),
    set: () => $errUtils.throwErrByPath('origin.unsupported.Cypress_session'),
  })
}
