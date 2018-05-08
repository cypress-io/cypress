module.exports = (on) => {
  on('task', {
    'errors' (message) {
      throw new Error(message)
    },
  })
}
