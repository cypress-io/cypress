const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const babelConfig = require('./babel.config')

module.exports = {
  entry: path.resolve(__dirname, 'src', 'index.jsx'),
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  mode: 'development',
  devtool: false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    publicPath: '/',
    chunkFilename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs|ts|tsx)$/,
        loader: 'babel-loader',
        options: babelConfig,
      },
      {
        test: /\.css$/,
        exclude: [/node_modules/, /\.modules\.css$/i],
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      filename: 'index.html',
    }),
  ],
}
