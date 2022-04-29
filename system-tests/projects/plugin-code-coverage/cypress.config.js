module.exports = {
  projectId: 'abc123',
  experimentalInteractiveRunEvents: true,
  e2e: {
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)
      on('file:preprocessor', require('@cypress/code-coverage/use-babelrc'))

      return config
    },
  },
}
