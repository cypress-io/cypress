module.exports = {
  'projectId': 'pid123',
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('before:spec', () => {
        setTimeout(() => {
          throw new Error('Async error from plugins file')
        }, 1000)
      })

      return config
    },
  },
}
