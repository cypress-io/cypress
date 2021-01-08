/**
 * Currently executing spec file.
 * @example
```
Cypress.spec
// {
//  name: "config_passing_spec.coffee",
//  relative: "cypress/integration/config_passing_spec.coffee",
//  absolute: "/users/smith/projects/web/cypress/integration/config_passing_spec.coffee"
//  specType: "integration"
// }
```
*/
export interface CypressSpec {
  name: string // "config_passing_spec.coffee"
  relative: string // "cypress/integration/config_passing_spec.coffee" or "__all" if clicked all specs button
  absolute: string
  specFilter?: string // optional spec filter used by the user
  specType?: CypressSpecType
}

/**
 * Spec type for the given test. "integration" is the default, but
 * tests run using experimentalComponentTesting will be "component"
 *
 * @see https://on.cypress.io/experiments
 */
export type CypressSpecType = 'integration' | 'component'
