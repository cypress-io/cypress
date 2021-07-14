const path = require('path')

module.exports = (on) => {
  on('file:preprocessor', () => {
    return path.join(__dirname, '../integration/another_spec.js')
  })
}
