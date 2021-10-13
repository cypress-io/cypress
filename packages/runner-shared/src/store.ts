import { action, observable } from 'mobx'
import { nanoid } from 'nanoid'
import { automation, automationStatus } from './automation'

export type RunMode = 'single'

const defaults = {
  component: {
    height: 500,
    width: 500,
  },
  e2e: {
    height: 660,
    width: 1000,
  },
}

export class BaseStore {
  @observable spec: Cypress.Spec | undefined
  @observable specs: Cypress.Spec[] = []
  @observable specRunId: string | undefined
  @observable runMode: RunMode = 'single'
  @observable automation: typeof automationStatus[number] = automation.CONNECTING
  @observable isLoading = true
  @observable width: number
  @observable height: number

  constructor (testingType: Cypress.TestingType) {
    this.width = defaults[testingType].width
    this.height = defaults[testingType].height
  }

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

  @action updateDimensions (width: number, height: number) {
    this.height = height
    this.width = width
  }
}
