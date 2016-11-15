_         = require("lodash")
fs        = require("fs-extra")
Promise   = require("bluebird")
path      = require("path")
cypressEx = require("@cypress/core-example")
glob      = require("glob")
hbs       = require("hbs")
cwd       = require("./cwd")

glob = Promise.promisify(glob)
fs = Promise.promisifyAll(fs)

INTEGRATION_EXAMPLE_SPEC = cypressEx.getPathToExample()

module.exports = {
  integration: (folder) ->
    @verifyScaffolding folder, =>
      @copy(INTEGRATION_EXAMPLE_SPEC, folder)

  fixture: (folder, options) ->
    @verifyScaffolding folder, options, =>
      @copy("example.json", folder)

  support: (folder, options, config) ->
    return Promise.resolve() if config.supportScripts is false

    @verifyScaffolding(folder, options, =>
      Promise.join(
        @copy("defaults.js", folder)
        @copy("commands.js", folder)
      )
    )
    .then ->
      indexPath = path.join(folder, "index.js")
      ## scaffold support/index.js with each file in the support folder
      ## this will help transition users from supportFolder to supportScripts
      fs.statAsync(indexPath)
      ## only if support/index.js doesn't exist already
      .catch =>
        ## skip if user has explicitly set supportScripts
        return if config.resolved.supportScripts.from isnt "default"

        Promise.join(
          fs.readFileAsync(cwd("lib", "scaffold", "index.js.hbs")),
          glob(path.join(folder, "**", "*"), {dir: no}).map (filePath) ->
            path.basename(filePath, path.extname(filePath))
        )
        .spread (indexTemplateBuffer, supportFiles) ->
          indexTemplate = hbs.handlebars.compile(indexTemplateBuffer.toString())
          contents = indexTemplate({ files: supportFiles })
          fs.outputFileAsync(indexPath, contents)

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
      ## we want to build out the folder + and example files
      ## but only create the example files if the folder doesn't
      ## exist
      ##
      ## this allows us to automatically insert the folder on existing
      ## projects (whenever they are booted) but allows the user to delete
      ## the file and not have it re-generated each time
      ##
      ## this is ideal because users who are upgrading to newer cypress version
      ## will still get the files scaffolded but existing users won't be
      ## annoyed by new example files coming into their projects unnecessarily
      fs.statAsync(folder)
      .catch =>
        fn.call(@)
}
