module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      on('task', {
        log (message) {
          // eslint-disable-next-line no-console
          console.log(message)

          return null
        },
      })
    },
  },
}
