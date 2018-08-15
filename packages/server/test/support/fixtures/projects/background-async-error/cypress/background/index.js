/* global Promise */

module.exports = (on) => {
  on('file:preprocessor', () => {
    return new Promise(() => {
      setTimeout(() => {
        throw new Error('Async error from background file')
      }, 50)
    })
  })
}
