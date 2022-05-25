module.exports = {
  projectId: 'abc123',
  experimentalInteractiveRunEvents: true,
  component: {
    specPattern: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}',
    supportFile: false,
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: require('./webpack.config.js'),
    },
  },
  e2e: {
    specPattern: 'cypress/e2e/**/*.spec.{js,ts}',
    supportFile: false,
  },
}
