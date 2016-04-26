fs      = require("fs-extra")
path    = require("path")
ospath  = require("ospath")
Promise = require("bluebird")
pkg     = require("../../package.json")

fs   = Promise.promisifyAll(fs)
name = pkg.productName or pkg.name
data = ospath.data()

isDevelopment = ->
  process.env.CYPRESS_ENV is "development"

module.exports = {
  ensure: ->
    ensure = =>
      Promise.join(
        fs.ensureDirAsync(@path())
        @symlink() if isDevelopment()
      )

    ## try twice to ensure the dir
    ensure()
    .catch(ensure)

  symlink: ->
    src  = path.dirname(@path())
    dest = path.join(__dirname, "..", "..", ".cy")

    fs.ensureSymlinkAsync(src, dest, "dir")

  path: (paths...) ->
    path.join(data, name, "cy", process.env.CYPRESS_ENV, paths...)

}