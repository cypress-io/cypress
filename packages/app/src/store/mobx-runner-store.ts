import { nanoid } from 'nanoid'
import type { AutomationStatus } from '../store'

const defaults = {
  url: '',
  component: {
    height: 500,
    width: 500,
  },
  e2e: {
    height: 660,
    width: 1000,
  },
} as const

// We grab MobX from `window.UnifiedRunner`
// instead of importing it to ensure we
// use the same instance of MobX across
// the Vite bundle ("Unified App", 10.x)
// and the "legacy" code that uses MobX
// which is `@packages/driver` and `@packages/reporter`.
const {
  observable,
  action,
} = window.UnifiedRunner.MobX

export class MobxRunnerStore {
  @observable spec?: Cypress.Spec
  @observable specs: Cypress.Spec[] = []
  @observable specRunId?: string
  @observable isLoading = true
  @observable width: number
  @observable height: number
  @observable automation?: AutomationStatus

  constructor (testingType: Cypress.TestingType) {
    this.width = defaults[testingType].width
    this.height = defaults[testingType].height
  }

  @action setSpec (spec: Cypress.Spec | undefined) {
    this.spec = spec
    this.specRunId = nanoid()
  }

  @action checkCurrentSpecStillExists (specs: Cypress.Spec[]) {
    const newSpecsAbsolutes = new Set(specs.map((spec) => spec.absolute))

    this.specs.forEach((oldSpec) => {
      if (!newSpecsAbsolutes.has(oldSpec.absolute) && this.spec?.absolute === oldSpec.absolute) {
        this.spec = undefined
      }
    })
  }

  @action setSpecs (specs: Cypress.Spec[]) {
    this.checkCurrentSpecStillExists(specs)
    this.specs = specs
  }

  @action setIsLoading (isLoading: boolean) {
    this.isLoading = isLoading
  }

  @action updateDimensions (width: number, height: number) {
    this.height = height
    this.width = width
  }
}

export function getMobxRunnerStore () {
  if (!mobxRunnerStore) {
    throw Error('mobxRunnerStore is undefined! Need to call initializeMobxStore')
  }

  return mobxRunnerStore
}

export const initializeMobxStore = (testingType: Cypress.TestingType) => {
  mobxRunnerStore = new MobxRunnerStore(testingType)

  return mobxRunnerStore
}

let mobxRunnerStore: MobxRunnerStore
