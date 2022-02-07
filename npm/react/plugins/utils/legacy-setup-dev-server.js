function getLegacyDevServer (devServer, postProcessConfig = (config) => config) {
  return (on, config, ...args) => {
    on('dev-server:start', (cypressDevServerConfig) => {
      return devServer(cypressDevServerConfig, ...args)
    })

    return postProcessConfig(config)
  }
}

module.exports = { getLegacyDevServer }
