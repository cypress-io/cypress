module.exports = {
  'video': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'experimentalFetchPolyfill': true,
  'env': {
    'coverage': true,
  },
  'component': {
    devServer: require('@cypress/react/plugins/next'),
  },
}
