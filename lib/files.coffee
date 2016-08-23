fs      = require("fs-extra")
path    = require("path")
Promise = require("bluebird")

fs = Promise.promisifyAll(fs)

module.exports = {
  readFile: (projectRoot, file, options = {}) ->
    filePath = path.join(projectRoot, file)
    readFn = if path.extname(filePath) is ".json"
      fs.readJsonAsync
    else
      fs.readFileAsync

    readFn(filePath, options.encoding or "utf8")

  writeFile: (projectRoot, file, contents, options = {}) ->
    filePath = path.join(projectRoot, file)
    fs.outputFileAsync(filePath, contents, options.encoding or "utf8")
}
