_           = require("lodash")
path        = require("path")
Promise     = require("bluebird")
cwd         = require("../cwd")
glob        = require("../util/glob")
specsUtil   = require("../util/specs")
pathHelpers = require("../util/path_helpers")
CacheBuster = require("../util/cache_buster")

module.exports = {
  handleFiles: (req, res, config) ->
    specsUtil.find(config)
    .then (files) ->
      res.json({
        integration: files
      })

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
        specsUtil.find(config)
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

}
