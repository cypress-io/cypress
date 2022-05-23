export default ({
  component: {
    supportFile: false,
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: require('./webpack.config'),
    },
  },
  e2e: {
    supportFile: false,
  },
})
