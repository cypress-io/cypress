const { devServer } = require('@cypress/react/plugins/next')

module.exports = {
  component: {
    supportFile: false,
    devServer,
  },
}
