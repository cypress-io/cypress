interface AdditionalOptions {
  /**
   * Location of the weppack.config Cypress should use
   */
   webpackFilename?: string
}

/**
 * Setup a webpack dev server with the proper configuration for babel transpilation
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param additionalOptions additional options object (create an empty object to see how to use it)
 */
declare function setupWebpackDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, additionalOptions?: AdditionalOptions): void
/**
 * Sets up a webpack dev server with the proper configuration for babel transpilation
 * @param options comes from the `setupDevServer()` function first argument
 * @param additionalOptions  additional options object (create an empty object to see how to use it)
 * @returns the resolved dev server object that cypress can use to start testing
 */
declare function setupWebpackDevServer(options: Cypress.DevServerConfig, additionalOptions?: AdditionalOptions): Cypress.ResolvedDevServerConfig

export = setupWebpackDevServer;