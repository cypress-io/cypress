/**
 * Sets up a Cypress component testing environment for your NextJs application
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 */
declare function setupNextDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions): void
/**
 * Sets up a Cypress component testing environment for your NextJs application
 * @param options comes from the `setupDevServer()` function first argument
 * @returns the resolved dev server object that cypress can use to start testing
 */
declare function setupNextDevServer(options: Cypress.DevServerConfig): Cypress.ResolvedDevServerConfig

export = setupNextDevServer;