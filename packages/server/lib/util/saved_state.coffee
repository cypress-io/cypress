log = require('../log')
fs = require('fs')
{ basename, join } = require('path')
md5 = require('md5')
sanitize = require("sanitize-filename")

toHashName = (projectPath) ->
  throw new Error("Missing project path") unless projectPath
  name = sanitize(basename(projectPath))
  hash = md5(projectPath)
  "#{name}-#{hash}"

formStatePath = (projectPath) ->
  log('making saved state from %s', process.cwd())
  if projectPath
    log('for project path %s', projectPath)
  else
    log('missing project path, looking for project here')
    cypressJsonPath = join(process.cwd(), 'cypress.json')
    if fs.existsSync(cypressJsonPath)
      log('found cypress file %s', cypressJsonPath)
      projectPath = process.cwd()

  statePath = "state.json"
  if projectPath
    statePath = join(toHashName(projectPath), statePath)

  return statePath

module.exports = {
  toHashName: toHashName,
  formStatePath: formStatePath
}
