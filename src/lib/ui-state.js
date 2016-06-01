import _ from 'lodash'
import { action, observable } from 'mobx'

const defaults = {
  isRunning: false,

  url: '',
  loading: false,

  width: 1000,
  height: 660,
  scale: 100,
}

class UiState {
  defaults = defaults

  @observable isRunning = defaults.isRunning

  @observable url = defaults.url
  @observable loading = defaults.loading

  @observable width = defaults.width
  @observable height = defaults.height
  @observable scale = defaults.scale

  @action reset () {
    _.each(defaults, (defaultValue, key) => {
      this[key] = defaultValue
    })
  }

  serialize () {
    return _.transform(defaults, (state, __, key) => {
      state[key] = this[key]
    }, {})
  }
}

export default new UiState()
