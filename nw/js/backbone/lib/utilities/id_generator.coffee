@App.module "Utilities", (Utilities, App, Backbone, Marionette, $, _) ->

  API =
    startIdGenerator: (path) ->
      if !path
        throw new Error("Missing http path to ID Generator.  Cannot start ID Generator.")

      App.request "gui:open", path,
        show: false

  App.commands.setHandler "start:id:generator", (path) ->
    API.startIdGenerator(path)