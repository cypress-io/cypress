module.exports = {
  component: {
    experimentalSingleTabRunMode: true,
    devServer: () => {
      return { port: 3000 }
    },
    devServerConfig: {},
  },
}
