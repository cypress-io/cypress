import type { FoundSpec } from '@packages/types'

type SpecFile = Cypress.Cypress['spec']
type SpecFiles = SpecFile[]

export class SpecsStore {
  specFiles: SpecFiles = []

  constructor (
    private cypressConfig: Record<string, any>,
    private testingType: Cypress.TestingType,
  ) {}

  get specDirectory () {
    if (this.testingType === 'e2e') {
      return this.cypressConfig.resolved.integrationFolder.value
    }

    if (this.testingType === 'component') {
      return this.cypressConfig.resolved.componentFolder.value
    }
  }

  storeSpecFiles (specFiles: FoundSpec[]) {
    this.specFiles = specFiles
  }
}
