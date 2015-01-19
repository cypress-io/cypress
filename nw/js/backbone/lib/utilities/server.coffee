@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  # Server = require('./lib/server')

  API =
    runProject: (path) ->
      Server(projectRoot: path)
      .then (config) =>
        @startIdGenerator(config.idGeneratorPath)

    startIdGenerator: (parth) ->
      if !path
        throw new Error("Missing http path to ID Generator.  Cannot start ID Generator.")

      win = App.execute "gui:open", path
      win.hide()

  App.startIdGenerator = (path) ->

  App.commands.setHandler "run:project", (path) ->
    API.runProject(path)