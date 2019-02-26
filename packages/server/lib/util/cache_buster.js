const DIGITS = 3
const SEPERATOR = '-'

module.exports = {
  get () {
    return SEPERATOR + Math.random().toFixed(DIGITS).slice(2, 5)
  },

  strip (str) {
    if (this._hasCacheBuster(str)) {
      return str.slice(0, -4)
    }

    return str
  },

  _hasCacheBuster (str) {
    return str.split('').slice(-4, -3).join('') === SEPERATOR
  },
}
