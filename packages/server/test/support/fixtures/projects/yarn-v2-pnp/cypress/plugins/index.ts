const wp = require('@cypress/webpack-preprocessor')
const PnpWebpackPlugin = require('pnp-webpack-plugin')

const options = {
  webpackOptions: {
    module: {
      rules: [
        {
          test: /\.(j|t)sx?$/,
          use: [{
            loader: require.resolve('babel-loader'),
            options: {
              presets: [require.resolve('@babel/preset-env'), require.resolve('@babel/preset-typescript')],
            },
          }],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts'],
      plugins: [
        PnpWebpackPlugin,
      ],
    },
    resolveLoader: {
      plugins: [
        PnpWebpackPlugin.moduleLoader(module),
      ],
    },

  },
}

export default (on, config) => {
  on('file:preprocessor', wp(options))

  return config
}
