const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  component: {
    supportFile: false,
    devServer: (args) => {
      return devServer({ ...args, webpackConfig: {} })
    },
  },
}
