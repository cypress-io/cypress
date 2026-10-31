// Every config file that imports `defineConfig` loads this module, so it must
// not import the rest of the CLI. The Module API commands load it on first call.
import type * as CypressModule from './cypress'
import { normalizeModuleOptions } from './normalize-module-options'

function loadCypress (): Promise<typeof CypressModule> {
  return import('./cypress')
}

// The arguments are copied before the deferred import so that a caller who
// reuses or mutates them right after the call, such as one options object
// shared by several runs, does not change a run that already started.

/**
 * Opens Cypress GUI
 * @see https://on.cypress.io/module-api#cypress-open
 */
export function open (options: any = {}): Promise<any> {
  const normalized = normalizeModuleOptions(options)

  return loadCypress().then((cypress) => cypress.open(normalized))
}

/**
 * Runs Cypress tests in the current project
 * @see https://on.cypress.io/module-api#cypress-run
 */
export function run (options: any = {}): Promise<any> {
  const normalized = normalizeModuleOptions(options)

  return loadCypress().then((cypress) => cypress.run(normalized))
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
  parseRunArguments (args: string[]): Promise<any> {
    const argsCopy = Array.isArray(args) ? [...args] : args

    return loadCypress().then((cypress) => cypress.cli.parseRunArguments(argsCopy))
  },
}

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
export function defineConfig (config: any): any {
  return config
}

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
export function defineComponentFramework (config: any): any {
  return config
}
