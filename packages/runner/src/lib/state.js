import { action, computed, observable } from 'mobx'
import { automation, BaseStore } from '@packages/runner-shared'

const _defaults = {
  messageTitle: null,
  messageDescription: null,
  messageType: '',
  messageControls: null,

  reporterWidth: null,
  specListWidth: null,
  specs: [],
}

export default class State extends BaseStore {
  defaults = _defaults

  @observable isRunning = false

  @observable.ref messageControls = _defaults.messageControls

  @observable snapshot = {
    showingHighlights: true,
    stateIndex: 0,
  }

  // if null, the default CSS handles it
  // if non-null, the user has set it by resizing
  @observable reporterWidth = _defaults.reporterWidth
  @observable specListWidth = _defaults.specListWidth

  // what the dom reports, always in pixels
  @observable absoluteReporterWidth = 0
  @observable headerHeight = 0
  @observable absoluteSpecListWidth = 0

  @observable windowWidth = 0
  @observable windowHeight = 0

  @observable automation = automation.CONNECTING

  @observable.ref scriptError = null

  constructor ({ reporterWidth, specListWidth, specs, useInlineSpecList }) {
    super('e2e')
    this.reporterWidth = reporterWidth || _defaults.reporterWidth
    this.specListWidth = useInlineSpecList ? specListWidth : 0
    this.useInlineSpecList = useInlineSpecList || false
    this.specs = specs || _defaults.specs
  }

  @computed get scale () {
    if (this._containerWidth < this.width || this._containerHeight < this.height) {
      return Math.min(this._containerWidth / this.width, this._containerHeight / this.height, 1)
    }

    return 1
  }

  @computed get _containerWidth () {
    return this.windowWidth - this.absoluteReporterWidth - this.specListWidth
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

  @action updateWindowDimensions ({
    windowWidth,
    windowHeight,
    reporterWidth,
    headerHeight,
  }) {
    if (windowWidth != null) this.windowWidth = windowWidth

    if (windowHeight != null) this.windowHeight = windowHeight

    if (reporterWidth != null) this.absoluteReporterWidth = reporterWidth

    if (headerHeight != null) this.headerHeight = headerHeight
  }
}
