/**
* Order of preference for including shadow dom:
* experimental flag > command-level > programmatic config > test-level > suite-level > cypress.json
*/
export const resolveShadowDomInclusion = (Cypress: Cypress.Cypress, commandValue?: boolean): boolean => {
  if (!Cypress.config('experimentalShadowDomSupport')) return false

  if (commandValue != null) return commandValue

  return Cypress.config('includeShadowDom')
}
