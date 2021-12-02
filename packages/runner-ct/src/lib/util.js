export default {
  hasSpecFile () {
    return !!location.hash
  },

  updateSpecPath (specName) {
    location.hash = `/tests/${specName}`
  },

  specPath () {
    if (location.hash) {
      const match = location.hash.match(/tests\/(.*)$/)

      return match && match[1] || ''
    }

    return ''
  },
}
