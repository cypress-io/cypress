module.exports = {
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      framework: 'vue-cli',
      bundler: 'webpack',
    },
  },
  // These tests should run quickly / fail quickly,
  // since we intentionally causing error states for testing
  defaultCommandTimeout: 1000,
}
