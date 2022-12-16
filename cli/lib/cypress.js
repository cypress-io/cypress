// https://github.com/cypress-io/cypress/issues/316

const Promise = require('bluebird')
const tmp = Promise.promisifyAll(require('tmp'))

const fs = require('./fs')
const open = require('./exec/open')
const run = require('./exec/run')
const util = require('./util')
const cli = require('./cli')

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

    tmp.setGracefulCleanup()

    return tmp.fileAsync()
    .then((outputPath) => {
      options.outputPath = outputPath

      return run.start(options)
      .then((failedTests) => {
        return fs.readJsonAsync(outputPath, { throws: false })
        .then((output) => {
          if (!output) {
            return {
              status: 'failed',
              failures: failedTests,
              message: 'Could not find Cypress test run results',
            }
          }

          return output
        })
      })
    })
  },

  cli: {
    /**
     * Parses CLI arguments into an object that you can pass to "cypress.run"
     * @example
     *  const cypress = require('cypress')
     *  const cli = ['cypress', 'run', '--browser', 'firefox']
     *  const options = await cypress.cli.parseRunArguments(cli)
     *  // options is {browser: 'firefox'}
     *  await cypress.run(options)
     * @see https://on.cypress.io/module-api
     */
    parseRunArguments (args) {
      return cli.parseRunCommand(args)
    },
  },

  /**
   * Provides automatic code completion for configuration in many popular code editors.
   * While it's not strictly necessary for Cypress to parse your configuration, we
   * recommend wrapping your config object with `defineConfig()`
   * @example
   * module.exports = defineConfig({
   *   viewportWith: 400
   * })
   *
   * @see ../types/cypress-npm-api.d.ts
   * @param {Cypress.ConfigOptions} config
   * @returns {Cypress.ConfigOptions} the configuration passed in parameter
   */
  defineConfig (config) {
    return config
  },
}

module.exports = cypressModuleApi
