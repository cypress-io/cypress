const { getPathToDist } = require('@packages/resolve-dist')

module.exports = {
  handle (send) {
    return (req, res) => {
      const pathToFile = getPathToDist('static', req.params[0])

      return send(req, pathToFile)
      .pipe(res)
    }
  },
}
