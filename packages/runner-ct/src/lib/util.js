export default {
  hasSpecFile () {
    return !!location.hash
  },

  updateSpecPath (specName) {
    location.hash = `/tests/component/${specName}`
  },

  specPath () {
    if (location.hash) {
      const match = location.hash.match(/tests\/component\/(.*)$/)

      return match && match[1] || ''
    }

    return ''
  },
}
