gui            = require('nw.gui')
Server         = require('../../lib/server')

@App = do (Backbone, Marionette) ->

  App = new Marionette.Application

  App.addRegions
    mainRegion:  "#main-region"

  ## store the default region as the main region
  App.reqres.setHandler "default:region", -> App.mainRegion

  App.on "start", (options = {}) ->
    App.vent.trigger "start:projects:app"

  App.startIdGenerator = (path) ->
    if !path
      throw new Error("Missing http path to ID Generator.  Cannot start ID Generator.")

    idWin = gui.Window.open(path)
    idWin.hide()

  App.commands.setHandler "run:project", (path) ->
    Server(projectRoot: path)
    .then (config) ->
      App.startIdGenerator(config.idGeneratorPath)

  return App