const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  allowCypressEnv: false,
  component: {
    supportFile: false,
    devServer: (args) => {
      return devServer({ ...args, webpackConfig: {} })
    },
  },
}
