interface CRADevServerOptions {
  /**
   * Location of the weppack.config Cypress should use
   */
  webpackConfigPath?: string
}

/**
 * Sets up a Cypress component testing environment for your Create React App environment
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param options additional options object (create an empty object to see how to use it)
 */
declare function legacySetupCRADevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, options?: CRADevServerOptions): void

declare namespace legacySetupCRADevServer {
  /**
   * Sets up a Cypress component testing environment for your Create React App environment
   * @param devServerConfig comes from the `setupDevServer()` function first argument
   * @param options additional options object (create an empty object to see how to use it)
   * @returns the resolved dev server object that cypress can use to start testing
   */
  export function setupCRADevServer(devServerConfig: Cypress.DevServerConfig, options?: CRADevServerOptions): Cypress.ResolvedDevServerConfig
}

export = legacySetupCRADevServer;