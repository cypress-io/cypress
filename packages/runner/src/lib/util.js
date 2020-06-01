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
    }

    return ''
  },

  // TODO: handle both integration and components specs
  absoluteSpecPath (config) {
    if (config.spec.specType === 'component') {
      // hmm, the "spec" object seems to have all paths
      //  name: relative path wrt to its parent folder (integration or component)
      //  absolute: absolute file path on the host machine
      //  relative: relative path wrt to "cypress" folder
      return config.spec.absolute
    }

    const relativeSpecPath = path.relative('integration', this.specPath())

    return path.join(config.integrationFolder, relativeSpecPath)
  },
}
