md5       = require("md5")
path      = require("path")
debug     = require("debug")("cypress:server:saved_state")
Promise   = require("bluebird")
sanitize  = require("sanitize-filename")
cwd       = require("../cwd")
fs        = require("../util/fs")

toHashName = (projectRoot) ->
  if not projectRoot
    throw new Error("Missing project path")

  if not path.isAbsolute(projectRoot)
    throw new Error("Expected project absolute path, not just a name #{projectRoot}")

  name = sanitize(path.basename(projectRoot))
  hash = md5(projectRoot)
  "#{name}-#{hash}"

# async promise-returning method
formStatePath = (projectRoot) ->
  Promise.try ->
    debug("making saved state from %s", cwd())

    if projectRoot
      debug("for project path %s", projectRoot)
      return projectRoot

    debug("missing project path, looking for project here")

    cypressJsonPath = cwd("cypress.json")
    fs.pathExistsAsync(cypressJsonPath)
    .then (found) ->
      if found
        debug("found cypress file %s", cypressJsonPath)
        projectRoot = cwd()

      return projectRoot

  .then (projectRoot) ->
    fileName = "state.json"

    if projectRoot
      debug("state path for project #{projectRoot}")
      return path.join(toHashName(projectRoot), fileName)

    debug("state path for global mode")
    return path.join("__global__", fileName)

module.exports = {
  toHashName
  formStatePath
}
