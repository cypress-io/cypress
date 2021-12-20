const path = require('path')

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
}
