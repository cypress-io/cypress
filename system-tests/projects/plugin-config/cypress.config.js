module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      if (config.testingType !== 'e2e') {
        throw Error(`This is an e2e testing project. testingType should be 'e2e'. Received ${config.testingType}`)
      }

      return new Promise((resolve) => {
        setTimeout(resolve, 100)
      })
      .then(() => {
        config.defaultCommandTimeout = 500
        config.video = true
        config.videoCompression = 20
        config.env.foo = 'bar'

        return config
      })
    },
  },
}
