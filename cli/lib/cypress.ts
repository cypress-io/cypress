// https://github.com/cypress-io/cypress/issues/316
import tmp from 'tmp'
import fs from 'fs-extra'
import openModule from './exec/open'
import runModule from './exec/run'
import util from './util'
import cliImport from './cli'

  /**
   * Opens Cypress GUI
   * @see https://on.cypress.io/module-api#cypress-open
   */
export function open (options: any = {}): any {
  options = util.normalizeModuleOptions(options)

  return openModule.start(options)
}

/**
 * Runs Cypress tests in the current project
 * @see https://on.cypress.io/module-api#cypress-run
 */
export async function run (options: any = {}): Promise<any> {
  if (!runModule.isValidProject(options.project)) {
    throw new Error(`Invalid project path parameter: ${options.project}`)
  }

  options = util.normalizeModuleOptions(options)
  tmp.setGracefulCleanup()

  const outputPath: string = tmp.fileSync().name

  options.outputPath = outputPath

  const failedTests = await runModule.start(options)
  const output = await fs.readJson(outputPath, { throws: false })

  if (!output) {
    return {
      status: 'failed',
      failures: failedTests,
      message: 'Could not find Cypress test run results',
    }
  }

  return output
}

export const cli = {
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
    return cliImport.parseRunCommand(args)
  },
}

export { defineConfig, defineComponentFramework } from './module-api'
