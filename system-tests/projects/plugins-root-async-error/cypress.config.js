setTimeout(() => {
  throw new Error('Root async error from config file')
})

module.exports = {
  allowCypressEnv: false,
  e2e: {
    supportFile: false,
  },
}
