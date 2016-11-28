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

  fixture: (folder) ->
    @verifyScaffolding folder, =>
      @copy("example.json", folder)

  support: (folder, config) ->
    ## skip if user has explicitly set supportFile
    ## TODO: change this to use something like config.isDefault(supportFile)
    ## instead of drilling into all of these resolved properties
    return Promise.resolve() if config.resolved.supportFile.from isnt "default"

    @verifyScaffolding(folder, =>
      Promise.join(
        @copy("defaults.js", folder)
        @copy("commands.js", folder)
      )
    )
    .then ->
      ## scaffold support/index.js with each file in the support folder
      ## this will help transition users from supportFolder to supportFile
      try
        require.resolve(config.supportFile)
      catch err
        ## only if support/index.js doesn't exist already
        ## rethrow error if it's something unexpected
        throw err if err.code isnt 'MODULE_NOT_FOUND'

        Promise.join(
          fs.readFileAsync(cwd("lib", "scaffold", "index.js.hbs"), "utf8"),

          glob(path.join(folder, "**", "*"), {nodir: true})
          .map (filePath) ->
            ## strip off the extension from our filePath
            ext      = path.extname(filePath)
            filePath = filePath.replace(ext, "")

            ## get the relative path from the supportFolder
            ## to this specific file's path
            path.relative(config.supportFolder, filePath)
        )
        .spread (indexTemplate, supportFiles) ->
          indexTemplate = hbs.handlebars.compile(indexTemplate)
          contents      = indexTemplate({ files: supportFiles })

          fs.outputFileAsync(path.join(folder, "index.js"), contents)

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

  verifyScaffolding: (folder, fn) ->
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
