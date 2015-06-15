Promise   = require "bluebird"
fs        = require "fs-extra"
path      = require "path"

fs = Promise.promisifyAll(fs)

class Support
  constructor: (app) ->
    if not (@ instanceof Support)
      return new Support(app)

    if not app
      throw new Error("Instantiating lib/suppoer requires an app!")

    @app    = app
    @folder = path.join(@app.get("cypress").projectRoot, @app.get("cypress").supportFolder)

  copyExample: (supportDir) ->
    src  = path.join(process.cwd(), "lib", "scaffold", "spec_helper.js")
    dest = path.join(supportDir, "spec_helper.js")
    fs.copyAsync(src, dest)

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

    {projectRoot, supportFolder} = @app.get("cypress")

    supportDir = path.join(projectRoot, supportFolder)

    ## if the support dir doesnt exist
    ## then create it + the example fixture
    fs.statAsync(supportDir)
      .bind(@)
      .catch ->
        @copyExample(supportDir)

module.exports = Support
