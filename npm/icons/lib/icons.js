const path = require('path')
const dist = [__dirname, '..', 'dist']

function distPath () {
  const args = [].slice.call(arguments)

  return path.join.apply(path, dist.concat(args))
}

module.exports = {
  getPathToFavicon: (filename) => {
    return distPath('favicon', filename)
  },

  getPathToTray: (filename) => {
    return distPath('tray', filename)
  },

  getPathToIcon: (filename) => {
    return distPath('icons', filename)
  },

  getPathToLogo: (filename) => {
    return distPath('logo', filename)
  },
}
