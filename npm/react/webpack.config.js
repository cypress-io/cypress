const path = require('path')
const babelConfig = require('./babel.config')

const BUILD_DIR = path.resolve(__dirname, 'public')
const APP_DIR = path.resolve(__dirname, 'src')

/** @type import("webpack").Configuration */
const config = {
  entry: APP_DIR + '/index.jsx',
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs|ts|tsx)$/,
        loader: 'babel-loader',
        include: APP_DIR,
        options: babelConfig,
      },
      {
        test: /\.css$/,
        exclude: [/node_modules/],
        include: APP_DIR,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
}

module.exports = config
