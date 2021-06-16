import { action, computed, observable, makeObservable } from 'mobx'
import { automation } from '@packages/runner-shared'

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

  isLoading = true;
  isRunning = false;

  messageTitle = _defaults.messageTitle;
  messageDescription = _defaults.messageDescription;
  messageType = _defaults.messageType;
  messageControls = _defaults.messageControls;

  snapshot = {
    showingHighlights: true,
    stateIndex: 0,
  };

  url = _defaults.url;
  highlightUrl = _defaults.highlightUrl;
  isLoadingUrl = _defaults.isLoadingUrl;

  width = _defaults.width;
  height = _defaults.height;

  // if null, the default CSS handles it
  // if non-null, the user has set it by resizing
  reporterWidth = _defaults.reporterWidth;
  // what the dom reports, always in pixels
  absoluteReporterWidth = 0;
  headerHeight = 0;

  windowWidth = 0;
  windowHeight = 0;

  automation = automation.CONNECTING;

  scriptError = null;

  constructor (reporterWidth = _defaults.reporterWidth) {
    makeObservable(this, {
      isLoading: observable,
      isRunning: observable,
      messageTitle: observable,
      messageDescription: observable,
      messageType: observable,
      messageControls: observable.ref,
      snapshot: observable,
      url: observable,
      highlightUrl: observable,
      isLoadingUrl: observable,
      width: observable,
      height: observable,
      reporterWidth: observable,
      absoluteReporterWidth: observable,
      headerHeight: observable,
      windowWidth: observable,
      windowHeight: observable,
      automation: observable,
      scriptError: observable.ref,
      scale: computed,
      _containerWidth: computed,
      _containerHeight: computed,
      marginLeft: computed,
      displayScale: computed,
      messageStyles: computed.struct,
      setIsLoading: action,
      updateDimensions: action,
      updateWindowDimensions: action,
      clearMessage: action,
      setCallbackAfterUpdateToNull: action,
      resetUrl: action,
    })

    this.reporterWidth = reporterWidth
  }

  get scale () {
    if (this._containerWidth < this.width || this._containerHeight < this.height) {
      return Math.min(this._containerWidth / this.width, this._containerHeight / this.height, 1)
    }

    return 1
  }

  get _containerWidth () {
    return this.windowWidth - this.absoluteReporterWidth
  }

  get _containerHeight () {
    return this.windowHeight - this.headerHeight
  }

  get marginLeft () {
    return (this._containerWidth / 2) - (this.width / 2)
  }

  get displayScale () {
    return Math.floor(this.scale * 100)
  }

  get messageStyles () {
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

  setIsLoading (isLoading) {
    this.isLoading = isLoading
  }

  updateDimensions (width, height) {
    this.width = width
    this.height = height
  }

  updateWindowDimensions ({ windowWidth, windowHeight, reporterWidth, headerHeight }) {
    if (windowWidth != null) this.windowWidth = windowWidth

    if (windowHeight != null) this.windowHeight = windowHeight

    if (reporterWidth != null) this.absoluteReporterWidth = reporterWidth

    if (headerHeight != null) this.headerHeight = headerHeight
  }

  clearMessage () {
    this.messageTitle = _defaults.messageTitle
    this.messageDescription = _defaults.messageDescription
    this.messageType = _defaults.messageType
  }

  setCallbackAfterUpdate (cb) {
    this.callbackAfterUpdate = () => {
      this.setCallbackAfterUpdateToNull()

      cb()
    }
  }

  setCallbackAfterUpdateToNull () {
    this.callbackAfterUpdate = null
  }

  resetUrl () {
    this.url = _defaults.url
    this.highlightUrl = _defaults.highlightUrl
    this.isLoadingUrl = _defaults.isLoadingUrl
  }
}
