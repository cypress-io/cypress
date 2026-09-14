const fs = require('fs-extra')
const path = require('path')

// writes the results of the after:spec and after:run events to a file
// so they can be snapshotted by the outer test
module.exports = {
  e2e: {
    setupNodeEvents (on) {
      on('after:spec', (spec, results) => {
        return fs.outputJson(path.resolve(__dirname, '_results', 'results-after-spec.json'), { spec, results }, { spaces: 2 })
      })

      on('after:run', (results) => {
        return fs.outputJson(path.resolve(__dirname, '_results', 'results-after-run.json'), results, { spaces: 2 })
      })
    },
    supportFile: false,
  },
}
