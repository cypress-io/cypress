exports['makeWebpackConfig ignores userland webpack `output.publicPath` 1'] = {
  "output": {
    "publicPath": "/test-public-path/",
    "filename": "[name].js",
    "path": "/Users/lachlan/code/work/cypress5/npm/webpack-dev-server/src/dist"
  },
  "mode": "development",
  "optimization": {
    "splitChunks": {
      "chunks": "all"
    }
  },
  "plugins": [
    "HtmlWebpackPlugin",
    "CypressCTOptionsPlugin",
    "LazyCompilePlugin"
  ],
  "entry": "/Users/lachlan/code/work/cypress5/npm/webpack-dev-server/src/browser.js"
}
