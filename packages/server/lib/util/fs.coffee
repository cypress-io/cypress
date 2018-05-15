fs = require("fs-extra")
Promise = require("bluebird")

## warn users if somehow synchronous file methods are invoked
## these methods due to "too many files" errors are a huge pain
warnOnSyncFileSystem = ->
  console.error "WARNING: fs sync methods can fail due to EMFILE errors"
  console.error "Cypress only works reliably when ALL fs calls are async"
  console.error "You should modify these sync calls to be async"

topLines = (from, n, text) ->
  text.split("\n").slice(from, n).join("\n")

# just hide this function itself
# stripping top few lines of the stack
getStack = () ->
  err = new Error()
  topLines(3, 10, err.stack)

addSyncFileSystemWarnings = (fs) ->
  oldExistsSync = fs.existsSync
  fs.existsSync = (filename) ->
    warnOnSyncFileSystem()
    console.error(getStack())
    oldExistsSync(filename)

addSyncFileSystemWarnings(fs)

promisifiedFs = Promise.promisifyAll(fs)

module.exports = promisifiedFs
