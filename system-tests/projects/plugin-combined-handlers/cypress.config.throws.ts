/* eslint-disable no-console */
export default {
  fixturesFolder: false,
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      on('before:run', () => {
        throw new Error('before:run handler 1 failed')
      })

      on('before:run', () => console.log('before:run handler 2'))
    },
  },
}
