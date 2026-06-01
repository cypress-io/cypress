/* eslint-disable no-console */
module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      on('before:spec', (spec) => {
        console.log('before:spec:', spec.relative)
      })
    },
  },
}
