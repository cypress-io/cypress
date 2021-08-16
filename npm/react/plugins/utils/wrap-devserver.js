module.exports = function returnInjectDevServerFunction (devServer, postProcessConfig = () => {}) {
  return (...args) => {
    // Old CT plugin signature: setupDevServer(on, config)
    if (typeof args[0] === 'function') {
      const [on, config, additionalOptions] = args

      on('dev-server:start', (options) => {
        return devServer(options, additionalOptions)
      })

      return postProcessConfig(config)
    }

    // New CT plugin signature: setupDevServer(options)
    const [options, additionalOptions] = args

    return devServer(options, additionalOptions)
  }
}
