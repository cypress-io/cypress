/* global Promise */

module.exports = (on) => {
  on('browser:filePreprocessor', (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        throw new Error('Async error from background file')
      }, 50)
      resolve(file.filePath)
    })
  })
}
