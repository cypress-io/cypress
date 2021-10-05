import { action, observable } from 'mobx'
import { nanoid } from 'nanoid'
import { automation, automationStatus } from './automation'

export type RunMode = 'single'

export class BaseStore {
  @observable spec: Cypress.Spec | undefined
  @observable specs: Cypress.Spec[] = []
  @observable specRunId: string | undefined
  @observable runMode: RunMode = 'single'
  @observable automation: typeof automationStatus[number] = automation.CONNECTING
  @observable isLoading = true

  @action setSingleSpec (spec: Cypress.Spec | undefined) {
    this.setSpec(spec)
  }

  @action setSpec (spec: Cypress.Cypress['spec'] | undefined) {
    this.spec = spec
    this.specRunId = nanoid()
  }

  @action setSpecs (specs: Cypress.Spec[]) {
    this.specs = specs
  }

  @action updateSpecByUrl (specUrl: string) {
    const foundSpec = this.specs.find((x) => x.name === decodeURI(specUrl))

    if (foundSpec) {
      this.spec = foundSpec
    }
  }

  @action setIsLoading (isLoading) {
    this.isLoading = isLoading
  }

}
