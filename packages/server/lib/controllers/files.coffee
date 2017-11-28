_           = require("lodash")
path        = require("path")
glob        = require("glob")
Promise     = require("bluebird")
minimatch   = require("minimatch")
cwd         = require("../cwd")
api         = require("../api")
user        = require("../user")
pathHelpers = require("../util/path_helpers")
CacheBuster = require("../util/cache_buster")
errors      = require("../errors")
log         = require("debug")("cypress:server:files")

glob = Promise.promisify(glob)

module.exports = {
  handleFiles: (req, res, config) ->
    @getTestFiles(config)
    .then (files) ->
      res.json files

  handleIframe: (req, res, config, getRemoteState) ->
    test = req.params[0]

    iframePath = cwd("lib", "html", "iframe.html")

    @getSpecs(test, config)
    .then (specs) =>
      @getJavascripts(config)
      .then (js) =>
        res.render iframePath, {
          title:        @getTitle(test)
          domain:       getRemoteState().domainName
          # stylesheets:  @getStylesheets(config)
          javascripts:  js
          specs:        specs
        }

  getSpecs: (spec, config) ->
    convertSpecPath = (spec) =>
      ## get the absolute path to this spec and
      ## get the browser url + cache buster
      spec = pathHelpers.getAbsolutePathToSpec(spec, config)

      @prepareForBrowser(spec, config.projectRoot)

    getSpecs = =>
      ## grab all of the specs if this is ci
      if spec is "__all"
        @getTestFiles(config)
        .get("integration")
        .map (spec) ->
          ## grab the name of each
          spec.absolute
        .map(convertSpecPath)
      else
        ## normalize by sending in an array of 1
        [convertSpecPath(spec)]

    Promise
    .try =>
      getSpecs()

  prepareForBrowser: (filePath, projectRoot) ->
    filePath = path.relative(projectRoot, filePath)

    @getTestUrl(filePath)

  getTestUrl: (file) ->
    file += CacheBuster.get()
    "/__cypress/tests?p=#{file}"

  getTitle: (test) ->
    if test is "__all" then "All Tests" else test

  getJavascripts: (config) ->
    {projectRoot, supportFile, javascripts} = config

    ## automatically add in support scripts and any javascripts
    files = [].concat javascripts
    if supportFile isnt false
      files = [supportFile].concat(files)

    ## TODO: there shouldn't be any reason
    ## why we need to re-map these. its due
    ## to the javascripts array but that should
    ## probably be mapped during the config
    paths = _.map files, (file) ->
      path.resolve(projectRoot, file)

    Promise
    .map paths, (p) ->
      ## is the path a glob?
      return p if not glob.hasMagic(p)

      ## handle both relative + absolute paths
      ## by simply resolving the path from projectRoot
      p = path.resolve(projectRoot, p)
      glob(p, {nodir: true})
    .then(_.flatten)
    .map (filePath) =>
      @prepareForBrowser(filePath, projectRoot)

  getTestFiles: (config, specPattern) ->
    integrationFolderPath = config.integrationFolder
    log("looking for test files in the integration folder %s",
      integrationFolderPath)

    log("specPattern for test files is", specPattern)

    ## support files are not automatically
    ## ignored because only _fixtures are hard
    ## coded. the rest is simply whatever is in
    ## the javascripts array

    if config.fixturesFolder
      fixturesFolderPath = path.join(
        config.fixturesFolder,
        "**",
        "*"
      )

    supportFilePath = config.supportFile or []

    ## map all of the javascripts to the project root
    ## TODO: think about moving this into config
    ## and mapping each of the javascripts into an
    ## absolute path
    javascriptsPaths = _.map config.javascripts, (js) ->
      path.join(config.projectRoot, js)

    ## ignore fixtures + javascripts
    options = {
      sort:     true
      absolute: true
      cwd:      integrationFolderPath
      ignore:   _.compact(_.flatten([
        javascriptsPaths
        supportFilePath
        fixturesFolderPath
      ]))
    }

    ## filePath                          = /Users/bmann/Dev/my-project/cypress/integration/foo.coffee
    ## integrationFolderPath             = /Users/bmann/Dev/my-project/cypress/integration
    ## relativePathFromIntegrationFolder = foo.coffee
    ## relativePathFromProjectRoot       = cypress/integration/foo.coffee

    relativePathFromIntegrationFolder = (file) ->
      path.relative(integrationFolderPath, file)

    relativePathFromProjectRoot = (file) ->
      path.relative(config.projectRoot, file)

    setNameParts = (file) ->
      log("found test file %s", file)
      throw new Error("Cannot set parts of file from non-absolute path #{file}") if not path.isAbsolute(file)

      {
        name: relativePathFromIntegrationFolder(file)
        path: relativePathFromProjectRoot(file)
        absolute: file
      }

    ignorePatterns = [].concat(config.ignoreTestFiles)

    ## a function which returns true if the file does NOT match
    ## all of our ignored patterns
    doesNotMatchAllIgnoredPatterns = (file) ->
      ## using {dot: true} here so that folders with a '.' in them are matched
      ## as regular characters without needing an '.' in the
      ## using {matchBase: true} here so that patterns without a globstar **
      ## match against the basename of the file
      _.every ignorePatterns, (pattern) ->
        not minimatch(file, pattern, {dot: true, matchBase: true})

    matchesSpecPattern = (file) ->
      if not specPattern
        return true

      minimatch(file, specPattern, { dot: true, matchBase: true })

    ## grab all the files
    glob(config.testFiles, options)


    ## filter out anything that matches our
    ## ignored test files glob
    .filter(doesNotMatchAllIgnoredPatterns)
    .filter(matchesSpecPattern)
    .map(setNameParts)
    .then (files) ->
      log("found %d spec files", files.length)
      log(files)
      {
        integration: files
      }
}
