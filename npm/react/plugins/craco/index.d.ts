/**
 * Inject a dev server for using cyprescc ct with CRACO (https://github.com/gsoft-inc/craco)
 * @param on comes from the argument of the `pluginsFile` function
 * @param config comes from the argument of the `pluginsFile` function
 * @param cracoConfig the object exported of your craco.config.js file
 */
declare function setupCracoDevServer(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions, cracoConfig: any): void
/**
 * Sets up a dev server for using cyprescc ct with CRACO (https://github.com/gsoft-inc/craco)
 * @param options comes from the `setupDevServer()` function first argument
 * @param cracoConfig the object exported of your craco.config.js file
 * @returns the resolved dev server object that cypress can use to start testing
 */
declare function setupCracoDevServer(options: Cypress.DevServerOptions, cracoConfig: any): Cypress.ResolvedDevServerConfig

export = setupCracoDevServer;