const path = require('path')

const serverPath = path.join(__dirname, '..')

module.exports = (...args) => {
  return path.join(serverPath, ...args)
}
