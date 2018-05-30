os      = require("os")
path    = require("path")
ospath  = require("ospath")
Promise = require("bluebird")
la      = require("lazy-ass")
check   = require("check-more-types")
log     = require("debug")("cypress:server:appdata")
pkg     = require("@packages/root")
cwd     = require("../cwd")
fs      = require("../util/fs")

name = pkg.productName or pkg.name
data = ospath.data()

if not name
  throw new Error("Root package is missing name")

getSymlinkType = ->
  if os.platform() == "win32"
    "junction"
  else
    "dir"

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

    log("symlink folder from %s to %s", src, dest)
    symlinkType = getSymlinkType()
    fs.ensureSymlinkAsync(src, dest, symlinkType)

  removeSymlink: ->
    fs.removeAsync(cwd(".cy")).catch(->)

  path: (paths...) ->
    la(check.unemptyString(process.env.CYPRESS_ENV),
      "expected CYPRESS_ENV, found", process.env.CYPRESS_ENV)
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
