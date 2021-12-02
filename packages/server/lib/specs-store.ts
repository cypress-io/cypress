import type { FoundSpec } from '@packages/types'

type SpecFile = Cypress.Cypress['spec']
type SpecFiles = SpecFile[]

export class SpecsStore {
  specFiles: SpecFiles = []

  storeSpecFiles (specFiles: FoundSpec[]) {
    this.specFiles = specFiles
  }
}
