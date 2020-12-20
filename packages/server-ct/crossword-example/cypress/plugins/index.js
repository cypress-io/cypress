// // https://github.com/bahmutov/cypress-vue-unit-test#install
// const preprocessor = require('cypress-vue-unit-test/dist/plugins/webpack');
// module.exports = (on, config) => {
//   preprocessor(on, config);
//   // IMPORTANT return the config object
//   return config
// };

// const preprocessor = require('@cypress/vue/dist/plugins/webpack')

// module.exports = (on, config) => {
//   preprocessor(on, config)

//   // IMPORTANT return the config object
//   return config
// }

/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config) => {
  on('devserver:start', (options) => startDevServer(options))

  return config
}
