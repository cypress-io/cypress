os      = require("os")
path    = require("path")
ospath  = require("ospath")
Promise = require("bluebird")
la      = require("lazy-ass")
check   = require("check-more-types")
log     = require("debug")("cypress:server:appdata")
pkg     = require("@packages/root")
fs      = require("../util/fs")
cwd     = require("../cwd")

PRODUCT_NAME = pkg.productName or pkg.name
OS_DATA_PATH = ospath.data()

ELECTRON_APP_DATA_PATH = path.join(OS_DATA_PATH, PRODUCT_NAME)

if not PRODUCT_NAME
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
    { env } = process

    la(check.unemptyString(env.CYPRESS_ENV),
      "expected CYPRESS_ENV, found", env.CYPRESS_ENV)

    ## allow overriding the app_data folder
    folder = env.CYPRESS_KONFIG_ENV or env.CYPRESS_ENV

    p = path.join(ELECTRON_APP_DATA_PATH, "cy", folder, paths...)
    log("path: %s", p)
    p

  electronPartitionsPath: ->
    path.join(ELECTRON_APP_DATA_PATH, "Partitions")

  projectsPath: (paths...) ->
    @path("projects", paths...)

  remove: ->
    Promise.join(
      fs.removeAsync(@path())
      @removeSymlink()
    )

}
