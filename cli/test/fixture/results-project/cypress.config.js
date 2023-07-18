/* eslint-disable no-console */
const fs = require('fs-extra')
const path = require('path')

// writes the results of the after:spec and after:run events to a file
// so they can be snapshotted by the outer test
module.exports = {
  e2e: {
    setupNodeEvents (on) {
      on('after:spec', (spec, results) => {
        console.log('🔵🔵🔵🔵 after:spec 🔵🔵🔵🔵')

        const filePath = path.resolve(__dirname, '_results', 'results-after-spec.json')

        console.log('filePath:', filePath)

        return fs.outputJson(filePath, { spec, results }, { spaces: 2 })
        .then(() => {
          console.log('🟢🟢🟢🟢 after:spec success 🟢🟢🟢🟢')
        })
        .catch((err) => {
          console.log('🔴🔴🔴🔴 after:spec fail 🔴🔴🔴🔴')
          console.log(err.stack)
        })
      })

      on('after:run', (results) => {
        console.log('🔵🔵🔵🔵 after:run 🔵🔵🔵🔵')

        const filePath = path.resolve(__dirname, '_results', 'results-after-run.json')

        console.log('filePath:', filePath)

        return fs.outputJson(filePath, results, { spaces: 2 })
        .then(() => {
          console.log('🟢🟢🟢🟢 after:run success 🟢🟢🟢🟢')
        })
        .catch((err) => {
          console.log('🔴🔴🔴🔴 after:run fail 🔴🔴🔴🔴')
          console.log(err.stack)
        })
      })
    },
    supportFile: false,
  },
}
