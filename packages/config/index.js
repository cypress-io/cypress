/**
 * The default config for Cypress server
 */
const CONFIG_DEFAULTS = {
  port: null,
  hosts: null,
  morgan: true,
  baseUrl: null,
  socketId: null,
  projectId: null,
  userAgent: null,
  isTextTerminal: false,
  reporter: 'spec',
  reporterOptions: null,
  blacklistHosts: null,
  clientRoute: '/__/',
  xhrRoute: '/xhrs/',
  socketIoRoute: '/__socket.io',
  socketIoCookie: '__socket.io',
  reporterRoute: '/__cypress/reporter',
  ignoreTestFiles: '*.hot-update.js',
  testFiles: '**/*.*',
  defaultCommandTimeout: 4000,
  requestTimeout: 5000,
  responseTimeout: 30000,
  pageLoadTimeout: 60000,
  execTimeout: 60000,
  taskTimeout: 60000,
  video: true,
  videoCompression: 32,
  videoUploadOnPasses: true,
  modifyObstructiveCode: true,
  chromeWebSecurity: true,
  waitForAnimations: true,
  animationDistanceThreshold: 5,
  numTestsKeptInMemory: 50,
  watchForFileChanges: true,
  trashAssetsBeforeRuns: true,
  autoOpen: false,
  viewportWidth: 1000,
  viewportHeight: 660,
  fileServerFolder: '',
  videosFolder: 'cypress/videos',
  supportFile: 'cypress/support',
  fixturesFolder: 'cypress/fixtures',
  integrationFolder: 'cypress/integration',
  screenshotsFolder: 'cypress/screenshots',
  namespace: '__cypress',
  pluginsFile: 'cypress/plugins',
  configFile: 'cypress.json',

  // deprecated
  javascripts: [],
}

module.exports = {
  /**
   * Returns the default config for the Cypress server
   * @returns {Object} containing the default config.
   */
  getDefaults () {
    return CONFIG_DEFAULTS
  },
}
