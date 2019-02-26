path     = require("path")
fs       = require("fs-extra")
Promise  = require("bluebird")
request  = require("request-promise")

root       = path.join(__dirname, "..", "..", "..")
projects   = path.join(root, "test", "support", "fixtures", "projects")
tmpDir     = path.join(root, ".projects")

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
  project: ->
    @projectPath.apply(@, arguments)

  projectPath: (name) ->
    path.join(tmpDir, name)

  get: (fixture, encoding = "utf8") ->
    fs.readFileSync path.join(root, "test", "support", "fixtures", fixture), encoding

  path: (fixture) ->
    path.join(root, "test", "support", "fixtures", fixture)
