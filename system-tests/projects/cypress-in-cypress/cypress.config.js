module.exports = {
  projectId: 'abc123',
  experimentalInteractiveRunEvents: true,
  component: {
    experimentalSingleTabRunMode: true,
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
    additionalIgnorePattern: undefined, // To check if the fix for https://github.com/cypress-io/cypress/issues/22551 works
    supportFile: false,
  },
}
