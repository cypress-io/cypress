const path = require('path')

module.exports = (on) => {
  on('browser:filePreprocessor', () => {
    return path.join(__dirname, '../integration/another_spec.js')
  })
}
