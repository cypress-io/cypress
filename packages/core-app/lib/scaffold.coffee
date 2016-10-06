_         = require("lodash")
fs        = require("fs-extra")
Promise   = require("bluebird")
path      = require("path")
cypressEx = require("@cypress/core-example")
cwd       = require("./cwd")

fs = Promise.promisifyAll(fs)

INTEGRATION_EXAMPLE_SPEC = cypressEx.getPathToExample()

module.exports = {
  integration: (folder) ->
    @verifyScaffolding folder, =>
      @copy(INTEGRATION_EXAMPLE_SPEC, folder)

  fixture: (folder, options) ->
    @verifyScaffolding folder, options, =>
      @copy("example.json", folder)

  support: (folder, options) ->
    @verifyScaffolding folder, options, =>
      Promise.join(
        @copy("defaults.js", folder)
        @copy("commands.js", folder)
      )

  copy: (file, folder) ->
    ## allow file to be relative or absolute
    src  = path.resolve(cwd("lib", "scaffold"), file)
    dest = path.join(folder, path.basename(file))

    fs.copyAsync(src, dest)

  integrationExampleSize: ->
    fs
    .statAsync(INTEGRATION_EXAMPLE_SPEC)
    .get("size")

  integrationExampleName: ->
    path.basename(INTEGRATION_EXAMPLE_SPEC)

  verifyScaffolding: (folder, options = {}, fn) ->
    if _.isFunction(options)
      fn = options
      options = {}

    _.defaults options, {
      remove: false
    }

    ## if opts.remove is true then we should automatically
    ## remove the folder if it exists else noop
    if options.remove
      remove = ->
        ## try to remove it twice
        fs.removeAsync(folder)
        .catch(remove)

      fs.statAsync(folder)
      .then(remove)
      .catch ->

    else
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
      fs.statAsync(folder)
      .catch =>
        fn.call(@)
}
