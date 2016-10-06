fs      = require("fs-extra")
path    = require("path")
ospath  = require("ospath")
Promise = require("bluebird")
cwd     = require("../cwd")
pkg     = require("../../package.json")

fs   = Promise.promisifyAll(fs)
name = pkg.productName or pkg.name
data = ospath.data()

isProduction = ->
  process.env.CYPRESS_ENV is "production"

module.exports = {
  ensure: ->
    ensure = =>
      @removeSymlink()
      .then =>
        Promise.join(
          fs.ensureDirAsync(@path())
          @symlink() unless isProduction()
        )

    ## try twice to ensure the dir
    ensure()
    .catch(ensure)

  symlink: ->
    src  = path.dirname(@path())
    dest = cwd(".cy")

    fs.ensureSymlinkAsync(src, dest, "dir")

  removeSymlink: ->
    fs.removeAsync(cwd(".cy")).catch(->)

  path: (paths...) ->
    path.join(data, name, "cy", process.env.CYPRESS_ENV, paths...)

  remove: ->
    Promise.join(
      fs.removeAsync(@path())
      @removeSymlink()
    )

}