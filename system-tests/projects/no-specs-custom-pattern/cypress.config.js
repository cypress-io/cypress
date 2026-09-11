module.exports = {
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: false,
    specPattern: 'src/specs-folder/*.cy.{js,jsx}',
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: require('./webpack.config'),
    },
  },
  e2e: {
    supportFile: false,
    specPattern: 'src/**/*.{cy,spec}.{js,jsx}',
  },
}
