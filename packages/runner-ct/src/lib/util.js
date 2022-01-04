export default {
  hasSpecFile () {
    return !!location.hash
  },

  updateSpecPath (specRelative) {
    location.hash = `/tests/${specRelative}`
  },

  specPath () {
    if (location.hash) {
      const match = location.hash.match(/tests\/(.*)$/)

      return match && match[1] || ''
    }

    return ''
  },
}
