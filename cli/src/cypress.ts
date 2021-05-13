// https://github.com/cypress-io/cypress/issues/316
import Promise from 'bluebird'
import fs from './fs'
import open from './exec/open'
import { isValidProject, start } from './exec/run'
import cli from './cli'
import { normalizeModuleOptions } from './util'
import * as standardTmp from 'tmp'
import { PromisifyAll } from '../types/bluebird-override'

const tmp = Promise.promisifyAll(standardTmp) as PromisifyAll<typeof standardTmp>

// tmp.fileAsync()

const cypressModuleApi = {
  /**
   * Opens Cypress GUI
   * @see https://on.cypress.io/module-api#cypress-open
   */
  open (options = {}) {
    options = normalizeModuleOptions(options)

    return open.start(options)
  },

  /**
   * Runs Cypress tests in the current project
   * @see https://on.cypress.io/module-api#cypress-run
   */
  run (options = {}) {
    if (!isValidProject(options.project)) {
      return Promise.reject(new Error(`Invalid project path parameter: ${options.project}`))
    }

    options = normalizeModuleOptions(options)

    return tmp.fileAsync()
    .then((outputPath) => {
      options.outputPath = outputPath

      return start(options)
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
}

module.exports = cypressModuleApi
