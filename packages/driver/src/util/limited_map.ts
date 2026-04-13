class LimitedMap extends Map {
  private _limit: number

  constructor (limit = 100) {
    super()

    this._limit = limit
  }

  set (key, value) {
    if (this.size === this._limit) {
      const firstKey = this.keys().next().value

      this.delete(firstKey)
    }

    return super.set(key, value)
  }
}

export default LimitedMap
