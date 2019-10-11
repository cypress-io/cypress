path    = require("path")
Promise = require("bluebird")
fs      = require("./util/fs")
yaml    = require("js-yaml")

module.exports = {
  readFile: (projectRoot, file, options = {}) ->
    filePath = path.resolve(projectRoot, file)
    readFn = if path.extname(filePath) is ".json"
      fs.readJsonAsync
    else
      fs.readFileAsync

    readFn(filePath, options.encoding or "utf8")
    .then (contents) ->
      if path.extname(filePath) is ".yaml" or path.extname(filePath) is ".yml"
        {
          contents: yaml.safeLoad(contents)
          filePath: filePath
        }
      else 
        {
          contents: contents
          filePath: filePath
        }
    .catch (err) ->
      err.filePath = filePath
      throw err

  writeFile: (projectRoot, file, contents, options = {}) ->
    filePath = path.resolve(projectRoot, file)
    writeOptions = {
      encoding: options.encoding or "utf8"
      flag: options.flag or "w"
    }
    fs.outputFile(filePath, contents, writeOptions)
    .then ->
      {
        contents: contents
        filePath: filePath
      }
    .catch (err) ->
      err.filePath = filePath
      throw err
}
