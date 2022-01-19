module.exports = {
  projectId: 'abc123',
  experimentalInteractiveRunEvents: true,
  component: {
    specPattern: 'src/**/*.{spec,cy}.{js,ts,tsx,jsx}',
    supportFile: false,
    devServer: require('@cypress/react/plugins/load-webpack'),
    devServerConfig: {
      webpackFilename: 'webpack.config.js',
    },
  },
  e2e: {
    specPattern: 'cypress/e2e/**/*.spec.{js,ts}',
    supportFile: false,
  },
}
