export default {
  hasSpecFile () {
    return !!location.hash
  },

  specFile () {
    return this.specPath().replace(/(.*)\//, '')
  },

  specPath () {
    if (location.hash) {
      const match = location.hash.match(/tests\/(.*)$/)
      return match && match[1] || ''
    } else {
      return ''
    }
  },
}
