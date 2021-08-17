interface AdditionalOptions {
  /**
   * Location of the weppack.config Cypress should use
   */
   webpackConfigPath?: string
}

/**
 * Injects a Cypress component testing environment for your Create React App environment
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param additionalOptions additional options object (create an empty object to see how to use it)
 */
declare function setupCRADevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, additionalOptions?: AdditionalOptions): void
/**
 * Sets up a Cypress component testing environment for your Create React App environment
 * @param options comes from the `setupDevServer()` function first argument
 * @param additionalOptions  additional options object (create an empty object to see how to use it)
 * @returns the resolved dev server object that cypress can use to start testing
 */
declare function setupCRADevServer(options: Cypress.DevServerOptions, additionalOptions?: AdditionalOptions): Cypress.ResolvedDevServerConfig

export = setupCRADevServer;