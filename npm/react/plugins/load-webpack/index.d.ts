interface SetupWebpackDevServerOptions {
  /**
   * Location of the weppack.config Cypress should use
   */
  webpackFilename?: string
}

/**
 * Setup a webpack dev server with the proper configuration for babel transpilation
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param options additional options object (create an empty object to see how to use it)
 */
declare function legacySetupWebpackDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, options?: SetupWebpackDevServerOptions): void

declare namespace legacySetupWebpackDevServer {
  /**
   * Sets up a webpack dev server with the proper configuration for babel transpilation
   * @param devServerConfig comes from the `setupDevServer()` function first argument
   * @param options  additional options object (create an empty object to see how to use it)
   * @returns the resolved dev server object that cypress can use to start testing
   */
  export function setupWebpackDevServer(devServerConfig: Cypress.DevServerConfig, options?: SetupWebpackDevServerOptions): Cypress.ResolvedDevServerConfig
}

export = legacySetupWebpackDevServer;