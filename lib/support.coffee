Promise   = require("bluebird")
fs        = require("fs-extra")
path      = require("path")
cwd       = require("./cwd")

fs = Promise.promisifyAll(fs)

class Support
  constructor: (config = {}) ->
    if not (@ instanceof Support)
      return new Support(config)

    if not pr = config.projectRoot
      throw new Error("Instantiating lib/support requires a projectRoot!")

    if not sf = config.supportFolder
      throw new Error("Instantiating lib/support requires a supportFolder!")

    @folder = path.join(pr, sf)

  _copy: (file, folder) ->
    src  = cwd("lib", "scaffold", file)
    dest = path.join(folder, file)
    fs.copyAsync(src, dest)

  copyFiles: (folder) ->
    Promise.join(
      @_copy("defaults.js", folder)
      @_copy("commands.js", folder)
    )

  scaffold: ->
    ## we want to build out the supportFolder + and example file
    ## but only create the example file if the supportFolder doesnt
    ## exist
    ##
    ## this allows us to automatically insert the folder on existing
    ## projects (whenever they are booted) but allows the user to delete
    ## the support file and not have it re-generated each time
    ##
    ## this is ideal because users who are upgrading to newer cypress version
    ## will still get the folder support enabled but existing users wont be
    ## annoyed by new example files coming into their projects unnecessarily

    ## if the support dir doesnt exist
    ## then create it + the example fixture
    fs.statAsync(@folder)
    .catch =>
      @copyFiles(@folder)

module.exports = Support
