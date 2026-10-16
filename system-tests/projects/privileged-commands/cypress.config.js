module.exports = {
  e2e: {
    baseUrl: 'http://user:pass@localhost:9999/app',
    supportFile: false,
    setupNodeEvents (on) {
      on('task', {
        'return:arg' (arg) {
          return arg
        },
      })
    },
  },
}
