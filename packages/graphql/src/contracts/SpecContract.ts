export interface SpecContract extends Pick<Cypress.Spec, 'relative' | 'absolute' | 'name'> {
  specType: Cypress.CypressSpecType
}
