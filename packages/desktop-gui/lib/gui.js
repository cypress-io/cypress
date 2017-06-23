const path = require('path')

function file (name) {
  return `file://${path.join(__dirname, '..', 'dist', name)}`
}

module.exports = {
  getPathToIndex () {
    return file('index.html')
  },
}
