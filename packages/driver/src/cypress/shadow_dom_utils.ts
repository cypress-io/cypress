/**
* Order of preference for including shadow dom:
* command-level > programmatic config > test-level > suite-level > cypress.json
*/
export const resolveShadowDomInclusion = (Cypress: Cypress.Cypress, commandValue?: boolean): boolean => {
  if (commandValue != null) return commandValue

  return Cypress.config('includeShadowDom')
}
