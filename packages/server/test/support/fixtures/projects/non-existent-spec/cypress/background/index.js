module.exports = (on) => {
  on('file:preprocessor', () => {
    return '/does/not/exist.js'
  })
}
