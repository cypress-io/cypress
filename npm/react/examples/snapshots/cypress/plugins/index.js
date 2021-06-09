const injectDevServer = require('@cypress/react/plugins/react-scripts')
const { initPlugin: initSnapshots } = require('cypress-plugin-snapshots/plugin')

module.exports = (on, config) => {
  injectDevServer(on, config)
  // initialize the snapshots plugin following
  // https://github.com/meinaart/cypress-plugin-snapshots
  initSnapshots(on, config)

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
