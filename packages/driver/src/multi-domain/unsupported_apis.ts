import type { $Cy } from '../cypress/cy'
import $errUtils from '../cypress/error_utils'

export const handleUnsupportedAPIs = (Cypress: Cypress.Cypress, cy: $Cy) => {
  // The following commands/methods are not supported within the `switchToDomain`
  // callback since they are deprecated
  // @ts-ignore
  cy.route = () => $errUtils.throwErrByPath('switchToDomain.unsupported.route')
  // @ts-ignore
  cy.server = () => $errUtils.throwErrByPath('switchToDomain.unsupported.server')
  Cypress.Server = new Proxy(Cypress.Server, {
    get: () => $errUtils.throwErrByPath('switchToDomain.unsupported.Server'),
    // @ts-ignore
    set: () => $errUtils.throwErrByPath('switchToDomain.unsupported.Server'),
  })

  // @ts-ignore
  Cypress.Cookies.preserveOnce = () => $errUtils.throwErrByPath('switchToDomain.unsupported.Cookies_preserveOnce')

  // Nested `switchToDomain` is not currently supported, but will be in the future
  // @ts-ignore
  cy.switchToDomain = () => $errUtils.throwErrByPath('switchToDomain.unsupported.switchToDomain')

  // `intercept` and `session` are not supported within the `switchToDomain`
  // callback, but can be used outside of it for the same effect. It's unlikely
  // they will ever be supported unless we discover uses-cases that require it
  // @ts-ignore
  cy.intercept = () => $errUtils.throwErrByPath('switchToDomain.unsupported.intercept')
  // @ts-ignore
  cy.session = () => $errUtils.throwErrByPath('switchToDomain.unsupported.session')
}
