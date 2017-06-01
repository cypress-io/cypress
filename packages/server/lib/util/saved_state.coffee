log = require('../log')
fs = require('fs')
path = require('path')
md5 = require('md5')

toHashName = (projectPath) ->
  throw new Error("Missing project path") unless projectPath
  name = path.basename(projectPath)
  hash = md5(projectPath)
  "#{name}-#{hash}"

formStatePath = (projectPath) ->
  log('making saved state from %s', process.cwd())
  if projectPath
    log('for project path %s', projectPath)
  else
    log('missing project path, looking for project here')
    cypressJsonPath = path.join(process.cwd(), 'cypress.json')
    if fs.existsSync(cypressJsonPath)
      log('found cypress file %s', cypressJsonPath)
      projectPath = process.cwd()

  statePath = "state.json"
  if projectPath
    statePath = path.join(toHashName(projectPath), statePath)

  return statePath

module.exports = {
  toHashName: toHashName,
  formStatePath: formStatePath
}
