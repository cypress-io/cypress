/**
 * Sets up a Cypress component testing environment for your NextJs application
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 */
declare function legacyDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions): void

declare namespace legacyDevServer {
  interface CypressNextDevServerConfig {
    /**
     * Path to an index.html file that will serve as the template in
     * which your components will be rendered.
     */
    indexHtml?: string
  }

  /**
   * Type helper to make writing `CypressNextDevServerConfig` easier
   */
  function defineDevServerConfig(devServerConfig: CypressNextDevServerConfig): CypressNextDevServerConfig

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
declare function legacyDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, devServerConfig?: legacyDevServer.CypressNextDevServerConfig): void

export = legacyDevServer;