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

// represents a spec file on file system
export interface SpecFile {
  name: string
  baseName: string
  fileName: string
  relative: string
  absolute: string
}

// represents a spec file on file system and
// additional Cypress-specific information
export interface FoundSpec extends SpecFile {
  specFileExtension: string
  fileExtension: string
  specType: Cypress.CypressSpecType
}
