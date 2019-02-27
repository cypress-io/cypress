/* global Promise */

module.exports = (on) => {
  let thrown = false

  on('browser:filePreprocessor', (file) => {
    return new Promise((resolve) => {
      if (!thrown) {
        thrown = true
        setTimeout(() => {
          throw new Error('Async error from background file')
        }, 50)
      }

      resolve(file.filePath)
    })
  })
}
