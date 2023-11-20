const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    // This property is invalid as `experimentalStudio` is only available for e2e
    experimentalStudio: true,
    devServer () {
      // This test doesn't need to actually run any component tests
      // so we create a fake dev server to make it run faster and
      // avoid flake on CI.
      return {
        port: 1234,
        close: () => {},
      }
    },
  },
})
