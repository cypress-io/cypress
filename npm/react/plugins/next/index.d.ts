/**
 * Sets up a Cypress component testing environment for your NextJs application
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 */
declare function legacyDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions): void

declare namespace legacyDevServer {
  /**
   * Sets up a Cypress component testing environment for your NextJs application
   * @param cypressDevServerConfig comes from the `devServer()` function first argument
   * @returns the resolved dev server object that cypress can use to start testing
   */
  function devServer(cypressDevServerConfig: Cypress.DevServerConfig): Cypress.ResolvedDevServerConfig
}

export = legacyDevServer;