exports['webpack-options template correctly generates plugins config 1'] = `
const webpackPreprocessor = require("@cypress/webpack-preprocessor");

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
    // TODO: update with valid configuration for your app
    module: {
      rules: [{
        test: /\\.(js|jsx|mjs|ts|tsx)$/,
        loader: 'babel-loader',
        options: { ...babelConfig,
          cacheDirectory: path.resolve(__dirname, '..', '..', '.babel-cache')
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
