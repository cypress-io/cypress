md5       = require("md5")
path      =  require("path")
Promise   = require("bluebird")
sanitize  = require("sanitize-filename")
log       = require("../log")
cwd       = require("../cwd")
fs        = require("../util/fs")

toHashName = (projectPath) ->
  throw new Error("Missing project path") unless projectPath
  throw new Error("Expected project absolute path, not just a name #{projectPath}") unless path.isAbsolute(projectPath)
  name = sanitize(path.basename(projectPath))
  hash = md5(projectPath)
  "#{name}-#{hash}"

# async promise-returning method
formStatePath = (projectPath) ->
  Promise.resolve()
  .then ->
    log('making saved state from %s', cwd())
    if projectPath
      log('for project path %s', projectPath)
      return projectPath
    else
      log('missing project path, looking for project here')

      cypressJsonPath = cwd('cypress.json')
      fs.pathExists(cypressJsonPath)
      .then (found) ->
        if found
          log('found cypress file %s', cypressJsonPath)
          projectPath = cwd()
        return projectPath

  .then (projectPath) ->
    fileName = "state.json"
    if projectPath
      log("state path for project #{projectPath}")
      statePath = path.join(toHashName(projectPath), fileName)
    else
      log("state path for global mode")
      statePath = path.join("__global__", fileName)

    return statePath

module.exports = {
  toHashName: toHashName,
  formStatePath: formStatePath
}
