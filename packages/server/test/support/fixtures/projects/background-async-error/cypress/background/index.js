/* global Promise */

module.exports = (on) => {
  let thrown = false

  on('browser:filePreprocessor', () => {
    return new Promise(() => {
      if (!thrown) {
        thrown = true
        setTimeout(() => {
          throw new Error('Async error from background file')
        }, 50)
      }
    })
  })
}
