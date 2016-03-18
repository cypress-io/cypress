path = require("path")

## helper for resolving to the current working directory
## since electron does not play nice with process.cwd()
## this function should always return path.dirname('package.json')

appPath = do ->
  ## if lib is our basename then we haven't
  ## been concatted or moved and we need to
  ## walk up one folder to access our app path
  if path.basename(__dirname) is "lib"
    path.join(__dirname, "..")
  else
    ## we are already in the app path
    __dirname

## after we figure out our appPath
## if the process.cwd() isnt set to that
## then change it
if process.cwd() isnt appPath
  process.chdir(appPath)

module.exports = (args...) ->
  path.join(appPath, args...)
