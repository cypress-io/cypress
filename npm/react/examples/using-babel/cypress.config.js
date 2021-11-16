// @ts-check
const { defineConfig } = require('cypress')

// let's bundle spec files and the components they include using
// the same bundling settings as the project by loading .babelrc
// https://github.com/cypress-io/cypress/tree/master/npm/react#install
const { devServer } = require('@cypress/react/plugins/babel')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 500,
  viewportHeight: 500,
  component: {
    devServer,
    componentFolder: 'src',
    specPattern: '**/*spec.js',
  },
})
