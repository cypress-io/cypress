_           = require("lodash")
R           = require("ramda")
path        = require("path")
Promise     = require("bluebird")
cwd         = require("../cwd")
glob        = require("../util/glob")
specsUtil   = require("../util/specs")
pathHelpers = require("../util/path_helpers")
CacheBuster = require("../util/cache_buster")
debug       = require("debug")("cypress:server:controllers")
{ escapeFilenameInUrl } = require('../util/escape_filename')

SPEC_URL_PREFIX = "/__cypress/tests?p"

module.exports = {
  handleFiles: (req, res, config) ->
    debug("handle files")
    specsUtil.find(config)
    .then (files) ->
      res.json({
        integration: files
      })

  handleIframe: (req, res, config, getRemoteState) ->
    test = req.params[0]
    iframePath = cwd("lib", "html", "iframe.html")

    debug("handle iframe %o", { test })

    @getSpecs(test, config)
    .then (specs) =>
      @getJavascripts(config)
      .then (js) =>
        res.render iframePath, {
          title: @getTitle(test)
          domain: getRemoteState().domainName
          scripts:  JSON.stringify(js.concat(specs))
        }

  getSpecs: (spec, config) ->
    debug("get specs %o", { spec })

    convertSpecPath = (spec) =>
      ## get the absolute path to this spec and
      ## get the browser url + cache buster
      convertedSpec = pathHelpers.getAbsolutePathToSpec(spec, config)
      debug("converted %s to %s", spec, convertedSpec)

      @prepareForBrowser(convertedSpec, config.projectRoot)

    getSpecsHelper = =>
      ## grab all of the specs if this is ci
      experimentalComponentTestingEnabled = _.get(config, 'resolved.experimentalComponentTesting.value', false)

      if spec is "__all"
        specsUtil.find(config)
        .then R.tap (specs) ->
          debug("found __all specs %o", specs)
        .filter (spec) ->
          if experimentalComponentTestingEnabled
            return spec.specType == "integration"
          else
            return true
        .then R.tap (specs) ->
          debug("filtered __all specs %o", specs)
        .map (spec) ->
          ## grab the name of each
          spec.absolute
        .map(convertSpecPath)
      else
        ## normalize by sending in an array of 1
        [convertSpecPath(spec)]

    Promise
    .try =>
      getSpecsHelper()

  prepareForBrowser: (filePath, projectRoot) ->
    filePath = filePath.replace(SPEC_URL_PREFIX, "__CYPRESS_SPEC_URL_PREFIX__")
    filePath = escapeFilenameInUrl(filePath).replace("__CYPRESS_SPEC_URL_PREFIX__", SPEC_URL_PREFIX)
    relativeFilePath = path.relative(projectRoot, filePath)

    {
      absolute: filePath
      relative: relativeFilePath
      relativeUrl: @getTestUrl(relativeFilePath)
    }

  getTestUrl: (file) ->
    url = "#{SPEC_URL_PREFIX}=#{file}"
    debug("test url for file %o", {file, url})
    return url

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
