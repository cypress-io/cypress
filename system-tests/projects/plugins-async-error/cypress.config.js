module.exports = {
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('file:preprocessor', () => {
        return new Promise(() => {
          setTimeout(() => {
            throw new Error('Async error from plugins file')
          }, 250)
        })
      })

      return config
    },
  },
}
