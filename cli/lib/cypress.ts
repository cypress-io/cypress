// https://github.com/cypress-io/cypress/issues/316

import Bluebird from 'bluebird'
import tmpModule from 'tmp'
import fs from './fs'
import openModule from './exec/open'
import runModule from './exec/run'
import util from './util'
import cli from './cli'

const tmp = Bluebird.promisifyAll(tmpModule) as any

const cypressModuleApi = {
  /**
   * Opens Cypress GUI
   * @see https://on.cypress.io/module-api#cypress-open
   */
  open (options: any = {}): any {
    options = util.normalizeModuleOptions(options)

    return openModule.start(options)
  },

  /**
   * Runs Cypress tests in the current project
   * @see https://on.cypress.io/module-api#cypress-run
   */
  run (options: any = {}): any {
    if (!runModule.isValidProject(options.project)) {
      return Bluebird.reject(new Error(`Invalid project path parameter: ${options.project}`))
    }

    options = util.normalizeModuleOptions(options)

    tmp.setGracefulCleanup()

    return tmp.fileAsync()
    .then((outputPath: string) => {
      options.outputPath = outputPath

      return runModule.start(options)
      .then((failedTests: any) => {
        return fs.readJsonAsync(outputPath, { throws: false })
        .then((output: any) => {
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
    parseRunArguments (args: string[]): any {
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
  defineConfig (config: any): any {
    return config
  },

  /**
   * Provides automatic code completion for Component Frameworks Definitions.
   * While it's not strictly necessary for Cypress to parse your configuration, we
   * recommend wrapping your Component Framework Definition object with `defineComponentFramework()`
   * @example
   * module.exports = defineComponentFramework({
   *   type: 'cypress-ct-solid-js'
   *   // ...
   * })
   *
   * @see ../types/cypress-npm-api.d.ts
   * @param {Cypress.ThirdPartyComponentFrameworkDefinition} config
   * @returns {Cypress.ThirdPartyComponentFrameworkDefinition} the configuration passed in parameter
   */
  defineComponentFramework (config: any): any {
    return config
  },
}

export = cypressModuleApi
