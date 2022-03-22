import { action, observable } from 'mobx'
import { nanoid } from 'nanoid/non-secure'

export type RunMode = 'single' | 'multi'

export abstract class BaseStore {
  @observable spec: Cypress.Cypress['spec'] | undefined
  @observable specs: Cypress.Cypress['spec'][] = []
  @observable specRunId: string | undefined
  /** @type {"single" | "multi"} */
  @observable runMode: RunMode = 'single'
  @observable multiSpecs: Cypress.Cypress['spec'][] = [];

  @action setSingleSpec (spec: Cypress.Cypress['spec'] | undefined) {
    if (this.runMode === 'multi') {
      this.runMode = 'single'
      this.multiSpecs = []
    }

    this.setSpec(spec)
  }

  @action setSpec (spec: Cypress.Cypress['spec'] | undefined) {
    this.spec = spec
    this.specRunId = nanoid()
  }

  @action checkCurrentSpecStillExists (specs: Cypress.Cypress['spec'][]) {
    const newSpecsAbsolutes = new Set(specs.map((spec) => spec.absolute))

    this.specs.forEach((oldSpec) => {
      if (!newSpecsAbsolutes.has(oldSpec.absolute) && this.spec?.absolute === oldSpec.absolute) {
        this.spec = undefined
      }
    })
  }

  @action setSpecs (specs: Cypress.Cypress['spec'][]) {
    this.checkCurrentSpecStillExists(specs)

    this.specs = specs
  }

  @action updateSpecByUrl (specUrl: string) {
    const foundSpec = this.specs.find((x) => x.name === specUrl)

    if (foundSpec) {
      this.spec = foundSpec
    }
  }
}
