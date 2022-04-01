declare namespace CypressWebpackDevServer {
  interface CypressWebpackDevServerConfig {
    /**
     * Location of the weppack.config Cypress should use
     */
    webpackFilename?: string
  }

  /**
   * Sets up a webpack dev server with the proper configuration for babel transpilation
   * @param cypressDevServerConfig comes from the `devServer()` function first argument
   * @param devServerConfig additional config object (create an empty object to see how to use it)
   * @returns the resolved dev server object that cypress can use to start testing
   */
  function devServer(cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: CypressWebpackDevServerConfig): Cypress.ResolvedDevServerConfig
}

/**
 * Setup a webpack dev server with the proper configuration for babel transpilation
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param devServerConfig additional config object (create an empty object to see how to use it)
 */
declare function CypressWebpackDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, devServerConfig?: CypressWebpackDevServer.CypressWebpackDevServerConfig): void

export = CypressWebpackDevServer;