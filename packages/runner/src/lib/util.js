export default {
  hasSpecFile () {
    return !!location.hash
  },

  specPath () {
    if (location.hash) {
      const match = location.hash.match(/tests\/(.*)$/)

      return match && match[1] || ''
    }

    return ''
  },

  updateIntegrationSpecPath (specName) {
    location.hash = `/tests/integration/${specName}`
  },

  integrationSpecPath () {
    if (location.hash) {
      const match = location.hash.match(/tests\/integration\/(.*)$/)

      return match && match[1] || ''
    }

    return ''
  },
}
