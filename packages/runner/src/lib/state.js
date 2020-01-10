import { action, computed, observable } from 'mobx'
import automation from './automation'

const _defaults = {
  messageTitle: null,
  messageDescription: null,
  messageType: '',
  messageControls: null,

  width: 1000,
  height: 660,

  reporterWidth: null,

  url: '',
  highlightUrl: false,
  isLoadingUrl: false,
}

export default class State {
  defaults = _defaults

  @observable isLoading = true
  @observable isRunning = false

  @observable messageTitle = _defaults.messageTitle
  @observable messageDescription = _defaults.messageDescription
  @observable messageType = _defaults.messageType
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

  constructor (reporterWidth = _defaults.reporterWidth) {
    this.reporterWidth = reporterWidth
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
}
