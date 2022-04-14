setTimeout(() => {
  throw new Error('Root async error from config file')
})

module.exports = {
  e2e: {
    supportFile: false,
  },
}
