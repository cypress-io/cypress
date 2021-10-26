import { action, observable, computed } from 'mobx'
import { nanoid } from 'nanoid'
import { automation, automationStatus } from './automation'

export type SnapshotMessageDescription = 'info' | 'warning' | 'pinned'

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

export abstract class BaseStore {
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
  @observable windowHeight = 0
  @observable headerHeight = 0

  @observable messageTitle?: string
  @observable messageDescription?: SnapshotMessageDescription
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

  abstract get scale (): number

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

  @action
  setShowSnapshotHighlight = (showingHighlights: boolean) => {
    if (!this.snapshot) {
      return
    }

    this.snapshot.showingHighlights = showingHighlights
  }

  @action
  setSnapshotIndex = (stateIndex: number) => {
    if (!this.snapshot) {
      return
    }

    this.snapshot.stateIndex = stateIndex
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

  @computed.struct get messageStyles () {
    const actualHeight = this.height * this.scale
    const messageHeight = 33
    const nudge = 10

    if ((actualHeight + messageHeight + (nudge * 2)) >= this._containerHeight) {
      return { state: 'stationary' }
    }

    return {
      state: 'attached',
      styles: {
        top: (actualHeight + this.headerHeight + nudge),
      },
    }
  }

  @computed get _containerHeight () {
    return this.windowHeight - this.headerHeight
  }
}
