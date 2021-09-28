export interface CommonSearchOptions {
  projectRoot: Cypress.RuntimeConfigOptions['projectRoot']
  fixturesFolder: Cypress.ResolvedConfigOptions['fixturesFolder']
  supportFile: Cypress.ResolvedConfigOptions['supportFile']
  testFiles: Cypress.ResolvedConfigOptions['testFiles']
  ignoreTestFiles: Cypress.ResolvedConfigOptions['ignoreTestFiles']
}

export type FindSpecs = {
  componentFolder: Cypress.ResolvedConfigOptions['componentFolder']
  integrationFolder: Cypress.ResolvedConfigOptions['integrationFolder']
} & CommonSearchOptions

export interface FoundSpec {
  name: string
  relative: string
  absolute: string
  specType: Cypress.CypressSpecType
}