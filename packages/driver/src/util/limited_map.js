class LimitedMap extends Map {
  constructor (limit = 100) {
    super()

    this._limit = limit
  }

  set (key, value) {
    if (this.size === this._limit) {
      const firstKey = Array.from(this.keys())[0]

      this.delete(firstKey)
    }

    return super.set(key, value)
  }
}

module.exports = LimitedMap
