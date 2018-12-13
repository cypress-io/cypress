/* global Promise */

module.exports = (on) => {
  on('browser:filePreprocessor', () => {
    return new Promise(() => {
      setTimeout(() => {
        throw new Error('Async error from background file')
      }, 50)
    })
  })
}
