const _ = require('lodash')

class LimitedMap extends Map {
  constructor (limit = 100) {
    super()

    this._limit = limit
  }

  set (key, value) {
    if (this.size === this._limit) {
      const firstKey = _.first(this.keys())

      this.delete(firstKey)
    }

    return super.set(key, value)
  }
}

module.exports = LimitedMap
