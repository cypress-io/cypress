declare namespace CypressCRADevServer {
  interface CypressCRADevServerConfig {
    /**
     * Location of the weppack.config Cypress should use
     */
    webpackConfigPath?: string
  }

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
declare function CypressCRADevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, devServerConfig?: CypressCRADevServer.CypressCRADevServerConfig): void

export = CypressCRADevServer;