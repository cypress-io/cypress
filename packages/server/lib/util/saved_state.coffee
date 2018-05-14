md5       = require("md5")
path      =  require("path")
Promise   = require("bluebird")
sanitize  = require("sanitize-filename")
log       = require("../log")
cwd       = require("../cwd")
fs        = require("../util/fs")

toHashName = (projectRoot) ->
  throw new Error("Missing project path") unless projectRoot
  throw new Error("Expected project absolute path, not just a name #{projectRoot}") unless path.isAbsolute(projectRoot)
  name = sanitize(path.basename(projectRoot))
  hash = md5(projectRoot)
  "#{name}-#{hash}"

# async promise-returning method
formStatePath = (projectRoot) ->
  Promise.resolve()
  .then ->
    log('making saved state from %s', cwd())
    if projectRoot
      log('for project path %s', projectRoot)
      return projectRoot
    else
      log('missing project path, looking for project here')

      cypressJsonPath = cwd('cypress.json')
      fs.pathExists(cypressJsonPath)
      .then (found) ->
        if found
          log('found cypress file %s', cypressJsonPath)
          projectRoot = cwd()
        return projectRoot

  .then (projectRoot) ->
    fileName = "state.json"
    if projectRoot
      log("state path for project #{projectRoot}")
      statePath = path.join(toHashName(projectRoot), fileName)
    else
      log("state path for global mode")
      statePath = path.join("__global__", fileName)

    return statePath

module.exports = {
  toHashName: toHashName,
  formStatePath: formStatePath
}
