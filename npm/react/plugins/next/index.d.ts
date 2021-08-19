/**
 * Sets up a Cypress component testing environment for your NextJs application
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 */
declare function legacySetupNextDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions): void

declare namespace legacySetupNextDevServer {
  /**
   * Sets up a Cypress component testing environment for your NextJs application
   * @param devServerConfig comes from the `setupDevServer()` function first argument
   * @returns the resolved dev server object that cypress can use to start testing
   */
  export function setupNextDevServer(devServerConfig: Cypress.DevServerConfig): Cypress.ResolvedDevServerConfig
}

export = legacySetupNextDevServer;