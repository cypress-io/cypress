// https://github.com/cypress-io/cypress/issues/316

const Promise = require('bluebird')
const tmp = Promise.promisifyAll(require('tmp'))

const fs = require('./fs')
const open = require('./exec/open')
const run = require('./exec/run')
const util = require('./util')

const cypressModuleApi = {
  /**
   * Opens Cypress GUI
   * @see https://on.cypress.io/module-api#cypress-open
   */
  open (options = {}) {
    options = util.normalizeModuleOptions(options)

    return open.start(options)
  },

  /**
   * Runs Cypress tests in the current project
   * @see https://on.cypress.io/module-api#cypress-run
   */
  run (options = {}) {
    if (!run.isValidProject(options.project)) {
      return Promise.reject(new Error(`Invalid project path parameter: ${options.project}`))
    }

    options = util.normalizeModuleOptions(options)

    return tmp.fileAsync()
    .then((outputPath) => {
      options.outputPath = outputPath

      return run.start(options)
      .then((failedTests) => {
        return fs.readJsonAsync(outputPath, { throws: false })
        .then((output) => {
          if (!output) {
            return {
              failures: failedTests,
              message: 'Could not find Cypress test run results',
            }
          }

          return output
        })
      })
    })
  },
}

module.exports = cypressModuleApi
