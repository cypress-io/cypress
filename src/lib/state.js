import _ from 'lodash'
import { computed, observable, asReference } from 'mobx'
import automation from './automation'

const headerHeight = 46

// used as initial values and in reset method to reset state between runs
const defaults = {
  isRunning: false,

  messageTitle: null,
  messageDescription: null,
  messageType: '',

  url: '',
  isLoading: false,

  width: 1000,
  height: 660,
}

const state = observable({
  defaults: asReference(defaults),

  isRunning: defaults.isRunning,

  messageTitle: defaults.messageTitle,
  messageDescription: defaults.messageDescription,
  messageType: defaults.messageType,

  url: defaults.url,
  isLoading: defaults.isLoading,

  width: defaults.width,
  height: defaults.height,

  _windowWidth: 0,
  _windowHeight: 0,

  automation: automation.CONNECTING,

  @computed get scale () {
    if (this._windowWidth < this.width || this._containerHeight < this.height) {
      return Math.min(this._windowWidth / this.width, this._containerHeight / this.height, 1)
    }
    return 1
  },

  @computed get _containerHeight () {
    return this._windowHeight - headerHeight
  },

  @computed get marginLeft () {
    return (this._windowWidth / 2) - (this.width / 2)
  },

  @computed get displayScale () {
    return Math.floor(this.scale * 100)
  },

  @computed({ asStructure: true }) get messageStyles () {
    const actualHeight = this.height * this.scale
    const messageHeight = 33
    const nudge = 10

    if ((actualHeight + messageHeight + nudge) >= this._containerHeight) {
      return { bottom: 0, opacity: '0.7' }
    } else {
      return { top: (actualHeight + headerHeight + nudge), opacity: '0.9' }
    }
  },

  updateWindowDimensions: asReference(function (width, height) {
    this._windowWidth = width
    this._windowHeight = height
  }),

  clearMessage: asReference(function () {
    this.messageTitle = defaults.messageTitle
    this.messageDescription = defaults.messageDescription
    this.messageType = defaults.messageType
  }),

  reset: asReference(function () {
    _.each(defaults, (defaultValue, key) => {
      this[key] = defaultValue
    })
  }),
})

export default state
