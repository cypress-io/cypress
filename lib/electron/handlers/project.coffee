_        = require("lodash")
Promise  = require("bluebird")
config   = require("../../config")
errors   = require("../../errors")
cache    = require("../../cache")
Project  = require("../../project")
launcher = require("../../launcher")

## global reference to any open projects
openProject = null

module.exports = {
  open: (path, args = {}, options = {}) ->
    options = _.extend {}, config.whitelist(args), options

    ## store the currently open project
    openProject = Project(path)

    ## open the project and return
    ## the config for the project instance
    Promise.all([
      openProject.open(options)
      launcher.getBrowsers()
    ])
    .spread (project, browsers) ->
      ## TODO: maybe if there are no
      ## browsers here we should just
      ## immediately close the server?
      ## but continue sending the config
      project
      .setBrowsers(browsers)
      .return(project)

  opened: -> openProject

  launch: (browser, options = {}) ->
    openProject.getConfig()
    .then (cfg) ->
      launcher.launch(browser, cfg.clientUrl, options)

  focusBrowser: ->
    openProject?.focusBrowser()

  onSettingsChanged: ->
    Promise.try =>
      if not openProject
        errors.throw("NO_CURRENTLY_OPEN_PROJECT")
      else
        new Promise (resolve, reject) ->
          openProject.on "settings:changed", -> resolve()

  close: (options = {}) ->
    nullify = ->
      ## null this back out
      openProject = null

      Promise.resolve(null)

    if not openProject
      nullify()
    else
      Promise.all([
        launcher.close()
        openProject.close(options)
      ])
      .then(nullify)
}