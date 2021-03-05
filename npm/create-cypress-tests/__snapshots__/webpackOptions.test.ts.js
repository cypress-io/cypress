exports['webpack-options template correctly generates plugins config 1'] = `
const path = require("path");

const {
  startDevServer
} = require("@cypress/webpack-dev-Server");

const something = require("something");

module.exports = (on, config) => {
  /** @type import("webpack").Configuration */
  const webpackConfig = {
    resolve: {
      extensions: ['.js', '.ts', '.jsx', '.tsx']
    },
    mode: 'development',
    devtool: false,
    output: {
      publicPath: '/',
      chunkFilename: '[name].bundle.js'
    },
    // TODO: update with valid configuration for your components
    module: {
      rules: [{
        test: /\\.(js|jsx|mjs|ts|tsx)$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: path.resolve(__dirname, '.babel-cache')
        }
      }]
    }
  };
  on('dev-server:start', options => startDevServer({
    options,
    webpackConfig
  }));
};
`
