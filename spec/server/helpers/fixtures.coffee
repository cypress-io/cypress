path = require "path"
fs   = require "fs-extra"

root       = process.cwd()
projects   = path.join root, "spec", "fixtures", "projects"
tmpDir     = path.join root, ".projects"

module.exports =
  ## copies all of the project fixtures
  ## to the tmpDir .projects in the root
  scaffold: ->
    fs.copySync projects, tmpDir

  ## removes all of the project fixtures
  ## from the tmpDir .projects in the root
  remove: ->
    fs.removeSync tmpDir

  ## returns the path to project fixture
  ## in the tmpDir
  project: (name) ->
    path.join tmpDir, name

  get: (fixture) ->
    fs.readFileSync path.join(root, "spec", "fixtures", fixture)