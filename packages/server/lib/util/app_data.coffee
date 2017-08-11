fs      = require("fs-extra")
path    = require("path")
ospath  = require("ospath")
Promise = require("bluebird")
log     = require("debug")("cypress:server:appdata")
pkg     = require("@packages/root")
cwd     = require("../cwd")

fs   = Promise.promisifyAll(fs)
name = pkg.productName or pkg.name
data = ospath.data()

if not name
  throw new Error("Root package is missing name")

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
    p = path.join(data, name, "cy", process.env.CYPRESS_ENV, paths...)
    log("path: %s", p)
    p

  projectsPath: (paths...) ->
    @path("projects", paths...)

  remove: ->
    Promise.join(
      fs.removeAsync(@path())
      @removeSymlink()
    )

}
