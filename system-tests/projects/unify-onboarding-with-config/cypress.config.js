const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  component: {
    supportFile: false,
    testFiles: '**/*cy-spec.{js,jsx,ts,tsx}',
    componentFolder: 'src',
    devServer,
    devServerConfig: {
      output: {
        publicPath: '/',
      },
    },
  },
  e2e: {
    supportFile: false,
  },
}
