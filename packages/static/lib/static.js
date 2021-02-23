const path = require('path')

function dist (...args) {
  const paths = [__dirname, '..', 'dist'].concat(args)

  return path.join(...paths)
}

const getPathToDist = (...args) => {
  return dist(...args)
}

module.exports = {
  getPathToDist,

  handle (send) {
    return (req, res) => {
      const pathToFile = getPathToDist(req.params[0])

      return send(req, pathToFile)
      .pipe(res)
    }
  },
}
