log = require('../log')
cwd = require('../cwd')
fs = require('fs')
{ basename, join, isAbsolute } = require('path')
md5 = require('md5')
sanitize = require("sanitize-filename")

toHashName = (projectPath) ->
  throw new Error("Missing project path") unless projectPath
  throw new Error("Expected project absolute path, not just a name #{projectPath}") unless isAbsolute(projectPath)
  name = sanitize(basename(projectPath))
  hash = md5(projectPath)
  "#{name}-#{hash}"

formStatePath = (projectPath) ->
  log('making saved state from %s', cwd())
  if projectPath
    log('for project path %s', projectPath)
  else
    log('missing project path, looking for project here')
    cypressJsonPath = cwd('cypress.json')
    if fs.existsSync(cypressJsonPath)
      log('found cypress file %s', cypressJsonPath)
      projectPath = cwd()

  fileName = "state.json"
  if projectPath
    log("state path for project #{projectPath}")
    statePath = join(toHashName(projectPath), fileName)
  else
    log("state path for global mode")
    statePath = join("__global__", fileName)

  return statePath

module.exports = {
  toHashName: toHashName,
  formStatePath: formStatePath
}
