module.exports = (on) => {
  on('browser:filePreprocessor', () => {
    return '/does/not/exist.js'
  })
}
