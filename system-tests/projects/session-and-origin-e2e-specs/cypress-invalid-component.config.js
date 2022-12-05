module.exports = {
  numTestsKeptInMemory: 0,
  video: false,
  e2e: {},
  component: {
    devServer () {
      return {
        port: 1234,
        close: () => {},
      }
    },
    experimentalOriginDependencies: true,
  },
}
