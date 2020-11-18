// TODO: move this file into a "webpack" plugin
// `packages/webpack-plugin-ct`

const { support, files } = require('../server/webpack/bundle-specs')
const { init } = require('@cypress/evergreen/dist/main.bundle')

init(files, support)

if (module.hot) {
  module.hot.accept(['../server/webpack/bundle-specs'], (changes) => {
    window.runAllSpecs()
  })
}
