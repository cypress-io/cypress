import { action, observable } from 'mobx'
import { nanoid } from 'nanoid'
import { automation, automationStatus } from './automation'

export type RunMode = 'single'

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

type Callback = (...args: unknown[]) => void

export class BaseStore {
  @observable spec: Cypress.Spec | undefined
  @observable specs: Cypress.Spec[] = []
  @observable specRunId: string | undefined
  @observable runMode: RunMode = 'single'
  @observable automation: typeof automationStatus[number] = automation.CONNECTING
  @observable isLoading = true
  @observable width: number
  @observable height: number
  @observable url = ''
  @observable highlightUrl = false
  @observable isLoadingUrl = false
  @observable isRunning = false
  @observable useInlineSpecList = false

  @observable messageTitle?: string
  @observable messageDescription?: 'info' | 'warning' | 'pinned'
  @observable messageType?: string
  @observable viewportUpdateCallback?: Callback
  @observable messageControls?: any
  @observable snapshot?: {
    showingHighlights: boolean
    stateIndex: number
  }

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

  @action updateSpecByUrl (specUrl: string) {
    const foundSpec = this.specs.find((x) => x.name === specUrl)

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

  @action resetUrl () {
    this.url = ''
    this.highlightUrl = false
    this.isLoadingUrl = false
  }

  @action clearMessage () {
    this.messageTitle = undefined
    this.messageDescription = undefined
    this.messageType = undefined
  }

  @action setViewportUpdatedCallbackToNull () {
    this.viewportUpdateCallback = undefined
  }

  setViewportUpdatedCallback (cb: Callback) {
    this.viewportUpdateCallback = () => {
      this.setViewportUpdatedCallbackToNull()

      cb()
    }
  }
}
