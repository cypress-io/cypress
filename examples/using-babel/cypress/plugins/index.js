// let's bundle spec files and the components they include using
// the same bundling settings as the project by loading .babelrc
const preprocessor = require('cypress-react-unit-test/plugins/babelrc')
module.exports = (on, config) => {
  preprocessor(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
