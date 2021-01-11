import { action, computed, observable } from 'mobx'
import _ from 'lodash'
import automation from './automation'

export type RunMode = 'single' | 'multi'

interface Defaults {
  messageTitle: string | null
  messageDescription: string | null
  messageType: string
  messageControls: unknown
  specSearchText: string

  width: number
  height: number

  reporterWidth: number | null

  url: string
  highlightUrl: boolean
  isLoadingUrl: boolean

  spec: Cypress.Cypress['spec'] | null
  specs: Cypress.Cypress['spec'][]

  callbackAfterUpdate: ((...args: unknown[]) => void) | null
}

const _defaults: Defaults = {
  messageTitle: null,
  messageDescription: null,
  messageType: '',
  messageControls: null,
  specSearchText: '',

  width: 1000,
  height: 660,

  reporterWidth: null,

  url: '',
  highlightUrl: false,
  isLoadingUrl: false,

  spec: null,
  specs: [],

  callbackAfterUpdate: null,
}

export default class State {
  defaults = _defaults

  @observable isLoading = true
  @observable isRunning = false

  @observable messageTitle = _defaults.messageTitle
  @observable messageDescription = _defaults.messageDescription
  @observable messageType = _defaults.messageType
  @observable callbackAfterUpdate = _defaults.callbackAfterUpdate
  @observable specSearchText = _defaults.specSearchText
  @observable.ref messageControls = _defaults.messageControls

  @observable snapshot = {
    showingHighlights: true,
    stateIndex: 0,
  }

  @observable url = _defaults.url
  @observable highlightUrl = _defaults.highlightUrl
  @observable isLoadingUrl = _defaults.isLoadingUrl

  @observable width = _defaults.width
  @observable height = _defaults.height

  // if null, the default CSS handles it
  // if non-null, the user has set it by resizing
  @observable reporterWidth = _defaults.reporterWidth
  // what the dom reports, always in pixels
  @observable absoluteReporterWidth = 0
  @observable headerHeight = 0

  @observable windowWidth = 0
  @observable windowHeight = 0

  @observable automation = automation.CONNECTING

  @observable.ref scriptError = null

  @observable spec = _defaults.spec
  @observable specs = _defaults.specs
  /** @type {"single" | "multi"} */
  @observable runMode: RunMode = 'single'
  @observable multiSpecs: Cypress.Cypress['spec'][] = [];

  constructor ({
    reporterWidth = _defaults.reporterWidth,
    spec = _defaults.spec,
    specs = _defaults.specs,
  }) {
    this.reporterWidth = reporterWidth
    this.spec = spec
    this.specs = specs

    // TODO: receive chosen spec from state and set it here
  }

  @computed get scale () {
    if (this._containerWidth < this.width || this._containerHeight < this.height) {
      return Math.min(this._containerWidth / this.width, this._containerHeight / this.height, 1)
    }

    return 1
  }

  @computed get _containerWidth () {
    return this.windowWidth - this.absoluteReporterWidth
  }

  @computed get _containerHeight () {
    return this.windowHeight - this.headerHeight
  }

  @computed get marginLeft () {
    return (this._containerWidth / 2) - (this.width / 2)
  }

  @computed get displayScale () {
    return Math.floor(this.scale * 100)
  }

  @computed get filteredSpecs (): Cypress.Cypress['spec'][] {
    return this.specs.filter((spec) => spec.name.toLowerCase().includes(this.specSearchText))
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

  @action setIsLoading (isLoading) {
    this.isLoading = isLoading
  }

  @action setSearchSpecText (text: string) {
    this.specSearchText = text
  }

  @action updateDimensions (width, height) {
    this.width = width
    this.height = height
  }

  @action updateWindowDimensions ({ windowWidth, windowHeight, reporterWidth, headerHeight }) {
    if (windowWidth != null) this.windowWidth = windowWidth

    if (windowHeight != null) this.windowHeight = windowHeight

    if (reporterWidth != null) this.absoluteReporterWidth = reporterWidth

    if (headerHeight != null) this.headerHeight = headerHeight
  }

  @action clearMessage () {
    this.messageTitle = _defaults.messageTitle
    this.messageDescription = _defaults.messageDescription
    this.messageType = _defaults.messageType
  }

  setCallbackAfterUpdate (cb) {
    this.callbackAfterUpdate = () => {
      this.callbackAfterUpdate = null

      cb()
    }
  }

  @action resetUrl () {
    this.url = _defaults.url
    this.highlightUrl = _defaults.highlightUrl
    this.isLoadingUrl = _defaults.isLoadingUrl
  }

  @action setSpec (spec: Cypress.Cypress['spec'] | null) {
    this.spec = spec
  }

  @action setSpecs (specs) {
    this.specs = specs
  }

  @action updateSpecByUrl (specUrl) {
    const foundSpec = _.find(this.specs, { name: specUrl })

    if (foundSpec) {
      this.spec = foundSpec
    }
  }

  @action setSingleSpec (spec) {
    if (this.runMode === 'multi') {
      this.runMode = 'single'
      this.multiSpecs = []
    }

    this.setSpec(spec)
  }

  @action addSpecToMultiMode (newSpec: Cypress.Cypress['spec']) {
    const isAlreadyRunningNewSpec = this.multiSpecs.some(
      (existingSpec) => existingSpec.relative === newSpec.relative,
    )

    if (isAlreadyRunningNewSpec) {
      this.multiSpecs = this.multiSpecs.filter((existingSpec) => existingSpec.relative !== newSpec.relative)
    } else if (this.runMode === 'single' && this.spec) {
      // when the new
      this.multiSpecs = [this.spec, newSpec]
    } else {
      this.multiSpecs = [...this.multiSpecs, newSpec]
    }

    this.runMode = 'multi'
    this.runMultiMode().catch((e) => {
      throw e
    })
  }

  runMultiMode = async () => {
    const eventManager = require('./event-manager')
    const waitForRunEnd = () => new Promise((res) => eventManager.on('run:end', res))

    this.setSpec(null)
    for (const spec of this.multiSpecs) {
      this.setSpec(spec)
      await waitForRunEnd()
    }
  }
}
