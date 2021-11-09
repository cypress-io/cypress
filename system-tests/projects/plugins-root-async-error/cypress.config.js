setTimeout(() => {
  throw new Error('Root async error from config/plugins file')
})

module.exports = {}
