_           = require("lodash")
str         = require("underscore.string")
path        = require("path")
glob        = require("glob")
Promise     = require("bluebird")
cwd         = require("../cwd")
CacheBuster = require("../util/cache_buster")

glob = Promise.promisify(glob)

isIntegrationTestRe = /^integration/
isUnitTestRe        = /^unit/

module.exports = {
  handleFiles: (req, res, config) ->
    @getTestFiles(config)
    .then (files) ->
      res.json files

  handleIframe: (req, res, config) ->
    test = req.params[0]

    iframePath = cwd("lib", "html", "iframe.html")

    @getSpecs(test, config)
    .then (specs) =>
      @getJavascripts(config)
      .then (js) =>
        res.render iframePath, {
          title:        @getTitle(test)
          # stylesheets:  @getStylesheets(config)
          javascripts:  js
          specs:        specs
        }

  getSpecs: (spec, config) ->
    convertSpecPath = (spec) =>
      ## get the absolute path to this spec and
      ## get the browser url + cache buster
      spec = @getAbsolutePathToSpec(spec, config)

      @prepareForBrowser(spec, config.projectRoot)

    getSpecs = =>
      ## grab all of the specs if this is ci
      if spec is "__all"
        @getTestFiles(config)
        .map (spec) ->
          ## grab the name of each
          spec.name
        .map(convertSpecPath)
      else
        ## normalize by sending in an array of 1
        [convertSpecPath(spec)]

    Promise
    .try =>
      getSpecs()

  getAbsolutePathToSpec: (spec, config) ->
    switch
      ## if our file is an integration test
      ## then figure out the absolute path
      ## to it
      when isIntegrationTestRe.test(spec)
        ## strip off the integration part
        spec = path.relative("integration", spec)

        ## now simply join this with our integrationFolder
        ## which makes it an absolute path
        spec = path.join(config.integrationFolder, spec)

      # ## commented out until we implement unit testing
      # when isUnitTestRe.test(spec)

        ## strip off the unit part
        # spec = path.relative("unit", spec)

        # ## now simply resolve this with our unitFolder
        # ## which makes it an absolute path
        # spec = path.resolve(config.unitFolder, spec)

      else
        spec

  prepareForBrowser: (filePath, projectRoot) ->
    filePath = path.relative(projectRoot, filePath)

    @getTestUrl(filePath)

  getTestUrl: (file) ->
    file += CacheBuster.get()
    "/__cypress/tests?p=#{file}"

  getTitle: (test) ->
    if test is "__all" then "All Tests" else test

  getJavascripts: (config) ->
    {rootFolder, projectRoot, javascripts, supportFolder} = config

    ## automatically add in our support folder and any javascripts
    files = [].concat path.join(supportFolder, "**", "*"), javascripts

    ## TODO: there shouldn't be any reason
    ## why we need to re-map these. its due
    ## to the javascripts array but that should
    ## probably be mapped during the config
    paths = _.map files, (file) ->
      path.resolve(rootFolder, file)

    Promise
    .map paths, (p) ->
      ## does the path include a globstar?
      return p if not p.includes("*")

      ## handle both relative + absolute paths
      ## by simply resolving the path from rootFolder
      p = path.resolve(projectRoot, p)
      glob(p)
    .then(_.flatten)
    .map (filePath) =>
      @prepareForBrowser(filePath, projectRoot)

  getTestFiles: (config) ->
    integrationFolderPath = config.integrationFolder

    ## support files are not automatically
    ## ignored because only _fixtures are hard
    ## coded. the rest is simply whatever is in
    ## the javascripts array

    fixturesFolderPath = path.join(
      config.fixturesFolder,
      "**",
      "*"
    )

    supportFolderPath = path.join(
      config.supportFolder,
      "**",
      "*"
    )

    ## map all of the javascripts to the project root
    ## TODO: think about moving this into config
    ## and mapping each of the javascripts into an
    ## absolute path
    javascriptsPath = _.map config.javascripts, (js) ->
      path.join(config.rootFolder, js)

    ## ignore _fixtures + _support + javascripts
    options = {
      sort:     true
      realpath: true
      cwd:      integrationFolderPath
      ignore:   [].concat(javascriptsPath, supportFolderPath, fixturesFolderPath)
    }

    ## integrationFolderPath: /Users/bmann/Dev/my-project/cypress/integration
    ## filePath:              /Users/bmann/Dev/my-project/cypress/integration/foo.coffee
    ## prependedFilePath:     integration/foo.coffee

    prependIntegrationPath = (file) ->
      ## prepend integration before the file and return only the relative
      ## path between the integrationFolderPath + the file
      path.join("integration", path.relative(integrationFolderPath, file))

    ## grab all the js and coffee files
    glob("**/*.+(js|coffee)", options)
    .map (file) ->
      {name: prependIntegrationPath(file)}
}
