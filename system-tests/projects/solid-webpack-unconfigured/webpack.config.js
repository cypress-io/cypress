const path = require('path')

const mode = process.env.NODE_ENV || 'development'
const prod = mode === 'production'

module.exports = {
  entry: {
    'build/bundle': ['./src/main.js'],
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx'],
  },
  output: {
    path: path.join(__dirname, '/public'),
    filename: '[name].js',
    chunkFilename: '[name].[id].js',
  },
  module: {
    rules: [
      {
        test: /\.js[x]$/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.jsx/,
        use: ['solid-hot-loader'],
        // If and only if all your components are in `path/to/components` directory
        include: path.resolve(__dirname, 'path/to/components'),
      },
    ],
  },
  mode,
  devtool: prod ? false : 'source-map',
  devServer: {
    hot: true,
  },
}
