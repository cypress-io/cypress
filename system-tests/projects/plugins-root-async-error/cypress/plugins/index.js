setTimeout(() => {
  throw new Error('Root async error from plugins file')
})

module.exports = () => {}
