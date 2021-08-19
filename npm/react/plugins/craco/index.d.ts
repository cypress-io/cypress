interface CracoDevServerOptions {
  /**
   * The object exported of your craco.config.js file
   */
  cracoConfig: any
}

/**
 * Setup a dev server for using Cypress compoennt testing with CRACO (https://github.com/gsoft-inc/craco)
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param cracoConfig the object exported of your craco.config.js file
 */
declare function legacySetupCracoDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, cracoConfig: any): void

declare namespace legacySetupCracoDevServer {
  /**
   * Sets up a dev server for using Cypress compoennt testing with CRACO (https://github.com/gsoft-inc/craco)
   * @param devServerConfig comes from the `setupDevServer()` function first argument
   * @param options additional options object (create an empty object to see how to use it)
   * @returns the resolved dev server object that cypress can use to start testing
   */
  export function setupCracoDevServer(devServerConfig: Cypress.DevServerConfig, options: CracoDevServerOptions): Cypress.ResolvedDevServerConfig
}

export = legacySetupCracoDevServer;