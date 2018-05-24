path    = require("path")
Promise = require("bluebird")
fs      = require("./util/fs")

module.exports = {
  readFile: (projectRoot, file, options = {}) ->
    filePath = path.join(projectRoot, file)
    readFn = if path.extname(filePath) is ".json"
      fs.readJsonAsync
    else
      fs.readFileAsync

    readFn(filePath, options.encoding or "utf8")
    .then (contents) ->
      {
        contents: contents
        filePath: filePath
      }
    .catch (err) ->
      err.filePath = filePath
      throw err

  writeFile: (projectRoot, file, contents, options = {}) ->
    filePath = path.join(projectRoot, file)
    fs.outputFileAsync(filePath, contents, options.encoding or "utf8")
    .then ->
      {
        contents: contents
        filePath: filePath
      }
    .catch (err) ->
      err.filePath = filePath
      throw err
}
