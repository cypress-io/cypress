exports['makeWebpackConfig ignores userland webpack `output.publicPath` and `devServer.overlay` with webpack-dev-server v4 1'] = {
  "output": {
    "publicPath": "/test-public-path/",
    "filename": "[name].js"
  },
  "devServer": {
    "magicHtml": true,
    "client": {
      "progress": false,
      "overlay": false
    }
  },
  "optimization": {
    "emitOnErrors": true,
    "splitChunks": {
      "chunks": "all"
    }
  },
  "mode": "development",
  "plugins": [
    "HtmlWebpackPlugin",
    "CypressCTWebpackPlugin"
  ],
  "devtool": "inline-source-map"
}

exports['makeWebpackConfig ignores userland webpack `output.publicPath` and `devServer.overlay` with webpack-dev-server v3 1'] = {
  "output": {
    "publicPath": "/test-public-path/",
    "filename": "[name].js"
  },
  "devServer": {
    "progress": true,
    "overlay": false
  },
  "optimization": {
    "noEmitOnErrors": false,
    "splitChunks": {
      "chunks": "all"
    }
  },
  "mode": "development",
  "plugins": [
    "HtmlWebpackPlugin",
    "CypressCTWebpackPlugin"
  ],
  "devtool": "inline-source-map"
}
