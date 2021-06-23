import { action, observable } from 'mobx'
import { nanoid } from 'nanoid'

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

  @action setSpecs (specs: Cypress.Cypress['spec'][]) {
    this.specs = specs
  }
}
