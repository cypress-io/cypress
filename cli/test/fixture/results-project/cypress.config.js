/* eslint-disable no-console */
const fs = require('fs-extra')
const path = require('path')

// writes the results of the after:spec and after:run events to a file
// so they can be snapshotted by the outer test
module.exports = {
  e2e: {
    setupNodeEvents (on) {
      on('after:spec', (spec, results) => {
        return fs.outputJSON(path.resolve(__dirname, '..', '..', '_results', 'results-after-spec.json'), { spec, results }, { spaces: 2 })
        .catch((err) => {
          console.log('🔴🔴🔴🔴')
          console.log('Error saving results of after:spec')
          console.log('----')
          console.log(err.message)
          console.log(err.stack)
          console.log('🔴🔴🔴🔴')
        })
      })

      on('after:run', (results) => {
        return fs.outputJSON(path.resolve(__dirname, '..', '..', '_results', 'results-after-run.json'), results, { spaces: 2 })
        .catch((err) => {
          console.log('🔴🔴🔴🔴')
          console.log('Error saving results of after:run')
          console.log('----')
          console.log(err.message)
          console.log(err.stack)
          console.log('🔴🔴🔴🔴')
        })
      })
    },
    supportFile: false,
  },
}
