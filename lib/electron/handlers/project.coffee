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
    openProject
    .open(options)

  opened: -> openProject

  launch: (browser, url, options = {}) ->
    launcher.launch(browser, url, options)

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