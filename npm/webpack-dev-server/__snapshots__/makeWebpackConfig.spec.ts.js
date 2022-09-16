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
  "mode": "development",
  "optimization": {
    "emitOnErrors": true,
    "splitChunks": {
      "chunks": "all"
    }
  },
  "plugins": [
    "HtmlWebpackPlugin",
    "CypressCTWebpackPlugin"
  ]
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
  "mode": "development",
  "optimization": {
    "noEmitOnErrors": false,
    "splitChunks": {
      "chunks": "all"
    }
  },
  "plugins": [
    "HtmlWebpackPlugin",
    "CypressCTWebpackPlugin"
  ]
}
