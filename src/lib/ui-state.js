import _ from 'lodash'
import { computed, observable } from 'mobx'

const headerHeight = 46

const defaults = {
  isRunning: false,

  url: '',
  isLoading: false,

  width: 1000,
  height: 660,
}

const uiState = observable({
  defaults,

  isRunning: defaults.isRunning,

  url: defaults.url,
  isLoading: defaults.isLoading,

  width: defaults.width,
  height: defaults.height,

  _windowWidth: 0,
  _windowHeight: 0,

  @computed get scale () {
    const containerHeight = this._windowHeight - headerHeight

    if (this._windowWidth < this.width || containerHeight < this.height) {
      return Math.min(this._windowWidth / this.width, containerHeight / this.height, 1)
    }
    return 1
  },

  @computed get marginLeft () {
    return (this._windowWidth / 2) - (this.width / 2)
  },

  @computed get displayScale () {
    return Math.floor(this.scale * 100)
  },

  updateWindowDimensions (width, height) {
    this._windowWidth = width
    this._windowHeight = height
  },

  reset () {
    _.each(defaults, (defaultValue, key) => {
      this[key] = defaultValue
    })
  },

  // used for logging in main.jsx
  serialize () {
    return _(defaults)
      .transform((state, __, key) => {
        state[key] = this[key]
      }, {})
      .extend(_.pick(this, '_windowWidth', '_windowHeight', 'scale', 'displayScale'))
      .value()
  },
})

export default uiState
