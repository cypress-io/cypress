import { action, observable } from 'mobx'
import { nanoid } from 'nanoid'

export abstract class BaseStore {
  @observable spec: Cypress.Cypress['spec'] | undefined
  @observable specs: Cypress.Cypress['spec'][] = []
  @observable specRunId: string | undefined

  @action setSpec (spec: Cypress.Cypress['spec'] | undefined) {
    this.spec = spec
    this.specRunId = nanoid()
  }

  @action setSpecs (specs: Cypress.Cypress['spec'][]) {
    this.specs = specs
  }
}
