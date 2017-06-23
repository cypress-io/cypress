// https://github.com/cypress-io/cypress/issues/316

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const tmp = Promise.promisifyAll(require('tmp'))

const open = require('./exec/open')
const run = require('./exec/run')

module.exports = {
  open (options = {}) {
    return open.start(options)
  },

  run (options = {}) {
    return tmp.fileAsync()
    .then((outputPath) => {
      options.outputPath = outputPath

      return run.start(options)
      .then((failedTests) =>
        fs.readJsonAsync(outputPath, { throws: false })
          .then((output) => {
            if (!output) {
              return {
                failures: failedTests,
                message: 'Could not find Cypress test run results',
              }
            }
            return output
          })
      )
    })
  },
}
