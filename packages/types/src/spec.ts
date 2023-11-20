// TODO: Do we need this many ways to describe a spec?
export interface BaseSpec {
  name: string
  relative: string
  absolute: string
}

export interface SpecFile extends BaseSpec {
  baseName: string
  fileName: string
}

export interface FoundSpec extends SpecFile {
  specFileExtension: string
  fileExtension: string
  specType: Cypress.CypressSpecType
}

export interface SpecWithRelativeRoot extends FoundSpec {
  relativeToCommonRoot: string
}
