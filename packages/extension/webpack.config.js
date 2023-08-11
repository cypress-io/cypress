const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './app/init.js',
  // https://github.com/cypress-io/cypress/issues/15032
  // Default webpack output setting is "eval".
  // Chrome doesn't allow "eval" inside extensions.
  devtool: 'inline-cheap-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new webpack.DefinePlugin({
      // The @packages/extension needs access to the process.env.NODE_DEBUG variable.
      // Since it's one variable, it makes most sense to just use the
      // DefinePlugin to push the value into the bundle instead of providing the whole process
      'process.env.NODE_DEBUG': JSON.stringify('process.env.NODE_DEBUG'),
    }),
  ],
}
