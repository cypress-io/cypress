const devServer = require('@cypress/react/plugins/react-scripts')

module.exports = (on, config) => {
  devServer(on, config)

  return config
}
