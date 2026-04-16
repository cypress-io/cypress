module.exports = {
  'allowCypressEnv': false,
  'projectId': 'pid123',
  'e2e': {
    'supportFile': false,
    setupNodeEvents (on, config) {
      on('task', {
        log (message) {
          setTimeout(() => {
            throw new Error('Async error from plugins file')
          }, 0)

          return null
        },
      })

      return config
    },
  },
}
