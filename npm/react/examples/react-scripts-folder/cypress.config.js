module.exports = {
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 800,
  'component': {
    // load file devServer that comes with this plugin
    // https://github.com/bahmutov/cypress-react-unit-test#install
    devServer: require('@cypress/react/plugins/react-scripts'),
  },
}
