module.exports = {
  allowCypressEnv: false,
  e2e: {
    supportFile: false,
    setupNodeEvents: (on) => {
      on('task', () => {})
    },
  },
}
