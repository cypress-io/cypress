import path from 'path'

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

  absoluteSpecPath (config) {
    const relativeSpecPath = path.relative('integration', this.specPath())
    return path.join(config.integrationFolder, relativeSpecPath)
  },
}
