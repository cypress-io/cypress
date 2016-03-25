_           = require("underscore")
_.str       = require("underscore.string")
path        = require("path")
glob        = require("glob")
Promise     = require("bluebird")
cwd         = require("../cwd")
CacheBuster = require("../util/cache_buster")

module.exports = {
  handleFiles: (req, res, config) ->
    @getTestFiles(config)
    .then (files) ->
      res.json files

  handleIframe: (req, res, config) ->
    test = req.params[0]

    filePath = cwd("lib", "html", "empty_inject.html")

    @getSpecs(test, config).bind(@).then (specs) ->
      @getJavascripts(config).bind(@).then (js) ->
        res.render filePath, {
          title:        @getTitle(test)
          # stylesheets:  @getStylesheets(config)
          javascripts:  js
          specs:        specs
        }

  getTitle: (test) ->
    if test is "__all" then "All Tests" else test

  convertToAbsolutePath: (files) ->
    ## make sure its an array and remap to an absolute path
    files = _([files]).flatten()
    files.map (files) ->
      if /^\//.test(files) then files else "/" + files

  convertToSpecPath: (specs, config, options = {}) ->
    _.defaults options,
      test: true

    {integrationFolder, projectRoot, rootFolder, supportFolder} = config

    ## return the specs prefixed with /tests?p=spec
    _(specs).map (spec) ->
      ## if this is our support folder then
      ## its already prefixed with the correct path
      if _.str.contains(spec, supportFolder)
        spec = _.str.trim(spec, "/")
      else
        if options.test
          ## prepend with tests path excluding
          ## the projectRoot. basically turn
          ## integrationFolder back into a relative
          ## path
          relativeIntegrationPath = path.relative(projectRoot, integrationFolder)
          spec = "#{relativeIntegrationPath}/#{spec}"
        else
          ## make sure we have no leading
          ## or trailing forward slashes
          spec = _.compact([rootFolder, spec])
          spec = path.join(spec...)
          spec = _.str.trim(spec, "/")


      spec += CacheBuster.get()
      "/__cypress/tests?p=#{spec}"

  getSpecs: (test, config) ->
    ## grab all of the specs if this is ci
    if test is "__all"
      @getTestFiles(config).then (specs) =>
        @convertToSpecPath _(specs).pluck("name"), config
    else
      ## return just this single test
      Promise.resolve @convertToSpecPath([test], config)

  getStylesheets: (config) ->
    @convertToAbsolutePath config.stylesheets

  getJavascripts: (config) ->
    {projectRoot, javascripts, supportFolder} = config

    ## automatically add in our support folder and any javascripts
    files = [].concat path.join(supportFolder, "**", "*"), javascripts
    paths = @convertToAbsolutePath _.chain(files).compact().uniq().value()

    Promise
      .map paths, (p) ->
        ## does the path include a globstar?
        return p if not p.includes("*")

        new Promise (resolve, reject) ->
          ## handle both relative + absolute paths
          ## by simply resolving the path from projectRoot
          p = path.resolve(projectRoot, p)
          glob p, (err, files) ->
            reject(err) if err
            resolve(files)
      .then (files) ->
        _.chain(files).flatten().map (file) ->
          ## slice out the projectRoot from our files again
          file.replace(projectRoot, "")
        .value()
      .then (files) =>
        @convertToSpecPath(files, config, {test: false})

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
      path.join(config.projectRoot, js)

    new Promise (resolve, reject) ->
      ## ignore _fixtures + _support + javascripts
      options = {
        sort: true
        ignore: [].concat(javascriptsPath, supportFolderPath, fixturesFolderPath)
      }

      ## grab all the js and coffee files
      glob "#{integrationFolderPath}/**/*.+(js|coffee)", options, (err, files) ->
        reject(err) if err

        ## slice off the integrationFolder directory(ies) (which is our test folder)
        integrationFolderLength = integrationFolderPath.split("/").length

        files = _(files).map (file) ->
          {name: file.split("/").slice(integrationFolderLength).join("/")}
        files.path = integrationFolderPath

        resolve(files)

}