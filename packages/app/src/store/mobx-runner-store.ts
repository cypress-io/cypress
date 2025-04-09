import { nanoid } from 'nanoid'
import { action, observable, makeObservable } from 'mobx'
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

export class MobxRunnerStore {
  spec?: Cypress.Spec
  specs: Cypress.Spec[] = []
  specRunId?: string
  isLoading = true
  width: number
  height: number
  automation?: AutomationStatus
  canSaveStudioLogs = false

  constructor (testingType: Cypress.TestingType) {
    makeObservable(this, {
      spec: observable,
      specs: observable,
      specRunId: observable,
      isLoading: observable,
      width: observable,
      height: observable,
      automation: observable,
      canSaveStudioLogs: observable,
      setCanSaveStudioLogs: action,
      setSpec: action,
      checkCurrentSpecStillExists: action,
      setSpecs: action,
      setIsLoading: action,
      updateDimensions: action,
    })

    this.width = defaults[testingType].width
    this.height = defaults[testingType].height
  }

  setCanSaveStudioLogs (canSave: boolean) {
    this.canSaveStudioLogs = canSave
  }

  setSpec (spec: Cypress.Spec | undefined) {
    this.spec = spec
    this.specRunId = nanoid()
  }

  checkCurrentSpecStillExists (specs: Cypress.Spec[]) {
    const newSpecsAbsolutes = new Set(specs.map((spec) => spec.absolute))

    this.specs.forEach((oldSpec) => {
      if (!newSpecsAbsolutes.has(oldSpec.absolute) && this.spec?.absolute === oldSpec.absolute) {
        this.spec = undefined
      }
    })
  }

  setSpecs (specs: Cypress.Spec[]) {
    this.checkCurrentSpecStillExists(specs)
    this.specs = specs
  }

  setIsLoading (isLoading: boolean) {
    this.isLoading = isLoading
  }

  updateDimensions (width: number, height: number) {
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
