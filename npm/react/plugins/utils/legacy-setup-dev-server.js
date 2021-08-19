function getLegacySetupDevServer (setupDevServer, postProcessConfig = (config) => config) {
  return (on, config, ...args) => {
    on('dev-server:start', (devServerConfig) => {
      return setupDevServer(devServerConfig, ...args)
    })

    return postProcessConfig(config)
  }
}

module.exports = { getLegacySetupDevServer }
