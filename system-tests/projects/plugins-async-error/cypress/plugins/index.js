module.exports = (on) => {
  on('file:preprocessor', () => {
    return new Promise(() => {
      setTimeout(() => {
        throw new Error('Async error from plugins file')
      }, 50)
    })
  })
}
