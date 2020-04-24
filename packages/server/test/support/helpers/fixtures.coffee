fs       = require("fs-extra")
path     = require("path")
chokidar = require('chokidar')

root       = path.join(__dirname, "..", "..", "..")
projects   = path.join(root, "test", "support", "fixtures", "projects")
tmpDir     = path.join(root, ".projects")

## copy contents instead of deleting+creating new file, which can cause
## filewatchers to lose track of toFile.
copyContents = (fromFile, toFile) ->
  Promise.all([
    fs.open(toFile, 'w'),
    fs.readFile(fromFile),
  ])
  .then ([toFd, fromFileBuf]) ->
    fs.write(toFd, fromFileBuf)
    .finally ->
      fs.close(toFd)

module.exports = {
  ## copies all of the project fixtures
  ## to the tmpDir .projects in the root
  scaffold: ->
    fs.copySync projects, tmpDir

  scaffoldWatch: ->
    watchdir = path.resolve(__dirname, '../fixtures/projects')
    console.log('watching files due to --no-exit', watchdir)
    w = chokidar.watch(watchdir, {
    })
    .on 'change', (srcFilepath, stats) ->
      tmpFilepath = path.join(tmpDir, path.relative(watchdir, srcFilepath))
      copyContents(srcFilepath, tmpFilepath)
    .on 'error', console.error

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
}
