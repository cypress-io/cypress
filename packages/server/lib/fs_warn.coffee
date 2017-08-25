{T, F}  = require("ramda")

## warn users if somehow synchronous file methods are invoked
## these methods due to "too many files" errors are a huge pain
warnOnSyncFileSystem = ->
  console.error "WARNING: fs sync methods can fail due to EMFILE errors"
  console.error "Cypress only works reliably when ALL fs calls are async"
  console.error "You should modify these sync calls to be async"

topLines = (from, n) -> (text) ->
  text.split("\n").slice(from, n).join("\n")

# just hide this function itself
# stripping top few lines of the stack
getStack = () ->
  err = new Error()
  topLines(3, 10)(err.stack)

addSyncFileSystemWarnings = (fs) ->
  oldExistsSync = fs.existsSync
  fs.existsSync = (filename) ->
    warnOnSyncFileSystem()
    console.error(getStack())
    oldExistsSync(filename)

  if not fs.pathExists
    # pathExists was introduced to fs-extra@3.0.0
    # if it does not exist mimic it using async methods
    # and convert result into boolean
    fs.pathExists = (filename) ->
      fs.statAsync(filename)
      .then(T)
      .catch({code: "ENOENT"}, F)

module.exports = addSyncFileSystemWarnings
