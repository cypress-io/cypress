declare namespace CypressNextDevServer {
  interface CypressNextDevServerConfig {}

  /**
   * Sets up a Cypress component testing environment for your NextJs application
   * @param cypressDevServerConfig comes from the `devServer()` function first argument
   * @returns the resolved dev server object that cypress can use to start testing
   */
  function devServer(cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: CypressNextDevServerConfig): Cypress.ResolvedDevServerConfig
}

/**
 * Sets up a Cypress component testing environment for your NextJs application
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param devServerConfig additional config object (create an empty object to see how to use it)
 */
declare function CypressNextDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, devServerConfig?: CypressNextDevServer.CypressNextDevServerConfig): void

export = CypressNextDevServer;