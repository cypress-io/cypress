module.exports = {
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 500,
  'component': {
    // let's bundle spec files and the components they include using
    // the same bundling settings as the project by loading .babelrc
    // https://github.com/bahmutov/cypress-react-unit-test#install
    devServer: require('@cypress/react/plugins/babel'),
  },
}
