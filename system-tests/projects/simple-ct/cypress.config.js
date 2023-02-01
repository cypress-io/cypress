module.exports = {
  component: {
    experimentalSingleTabRunMode: true,
    // In order for Webkit to correctly exit in single tab mode, we have to disable video
    // https://github.com/cypress-io/cypress/issues/23815
    video: false,
    supportFile: false,
    devServer: {
      bundler: 'webpack',
      webpackConfig: {},
    },
  },
}
