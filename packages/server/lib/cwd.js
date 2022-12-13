const path = require('path')

module.exports = (...args) => {
  const serverPath = path.join(__dirname, '..')

  return path.join(serverPath, ...args)
}
