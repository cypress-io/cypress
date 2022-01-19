module.exports = (on) => {
  on('file:preprocessor', () => '/does/not/exist.js')
}
