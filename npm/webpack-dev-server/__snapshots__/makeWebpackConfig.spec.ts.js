exports['makeWebpackConfig ignores userland webpack `output.publicPath` 1'] = {
  "output": {
    "publicPath": "/test-public-path/",
    "filename": "[name].js"
  },
  "devServer": {
    "overlay": false
  },
  "mode": "development",
  "optimization": {
    "splitChunks": {
      "chunks": "all"
    }
  },
  "plugins": [
    "HtmlWebpackPlugin",
    "CypressCTWebpackPlugin"
  ]
}
