import _ from 'lodash'

// IE doesn't support Array.from or Map.prototype.keys
const getMapKeys = (map) => {
  if (_.isFunction(Array.from) && _.isFunction(map.keys)) {
    return Array.from(map.keys())
  }

  const keys: any[] = []

  map.forEach((key) => {
    keys.push(key)
  })

  return keys
}

class LimitedMap extends Map {
  private _limit: number

  constructor (limit = 100) {
    super()

    this._limit = limit
  }

  set (key, value) {
    if (this.size === this._limit) {
      const firstKey = _.first(getMapKeys(this))

      this.delete(firstKey)
    }

    return super.set(key, value)
  }
}

export default LimitedMap
