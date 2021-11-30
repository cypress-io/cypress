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

// TODO: Do we need this many ways to describe a spec?

// represents a spec file on file system and
export interface BaseSpec {
  name: string
  relative: string
  absolute: string
}

export interface SpecFile extends BaseSpec {
  baseName: string
  fileName: string
}

export interface SpecFileWithExtension extends SpecFile {
  fileExtension: string
}

export interface FoundSpec extends SpecFile {
  specFileExtension: string
  fileExtension: string
  specType: Cypress.CypressSpecType
}
