declare namespace legacyDevServer {
  interface CypressCRADevServerConfig {
    /**
     * Location of the weppack.config Cypress should use
     */
    webpackConfigPath?: string
  }

  /**
   * Type helper to make writing `CypressCRADevServerConfig` easier
   */
  function defineDevServerConfig(devServerConfig: CypressCRADevServerConfig): CypressCRADevServerConfig

  /**
   * Sets up a Cypress component testing environment for your Create React App environment
   * @param cypressDevServerConfig comes from the `devServer()` function first argument
   * @param devServerConfig additional config object (create an empty object to see how to use it)
   * @returns the resolved dev server object that cypress can use to start testing
   */
  function devServer(cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: CypressCRADevServerConfig): Cypress.ResolvedDevServerConfig
}

/**
 * Sets up a Cypress component testing environment for your Create React App environment
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param devServerConfig additional config object (create an empty object to see how to use it)
 */
declare function legacyDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, devServerConfig?: legacyDevServer.CypressCRADevServerConfig): void

export = legacyDevServer;