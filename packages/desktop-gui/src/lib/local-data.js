export default {
  get (key) {
    const value = localStorage[key]

    return value && JSON.parse(value)
  },

  set (key, value) {
    localStorage[key] = JSON.stringify(value)
  },

  remove (key) {
    localStorage.removeItem(key)
  },
}
