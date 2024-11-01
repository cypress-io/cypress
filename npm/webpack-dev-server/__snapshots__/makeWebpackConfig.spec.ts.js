exports['makeWebpackConfig ignores userland webpack `output.publicPath` and `devServer.overlay` with webpack-dev-server v4 1'] = {
  'output': {
    'publicPath': '/test-public-path/',
    'filename': '[name].js',
  },
  'devServer': {
    'client': {
      'progress': false,
      'overlay': false,
    },
  },
  'optimization': {
    'emitOnErrors': true,
    'sideEffects': false,
    'splitChunks': {
      'chunks': 'all',
    },
  },
  'devtool': 'inline-source-map',
  'mode': 'development',
  'plugins': [
    'HtmlWebpackPlugin',
    'CypressCTWebpackPlugin',
  ],
}

exports['makeWebpackConfig ignores userland webpack `output.publicPath` and `devServer.overlay` with webpack-dev-server v5 1'] = {
  'output': {
    'publicPath': '/test-public-path/',
    'filename': '[name].js',
  },
  'devServer': {
    'client': {
      'progress': false,
      'overlay': false,
    },
  },
  'optimization': {
    'emitOnErrors': true,
    'sideEffects': false,
    'splitChunks': {
      'chunks': 'all',
    },
  },
  'devtool': 'inline-source-map',
  'mode': 'development',
  'plugins': [
    'HtmlWebpackPlugin',
    'CypressCTWebpackPlugin',
  ],
}
