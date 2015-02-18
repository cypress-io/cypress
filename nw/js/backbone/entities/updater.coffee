@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Updater extends Entities.Model
    getUpdater: ->
      @updater ? throw new Error("Updater object not found on model!")

    setUpdater: (upd) ->
      @updater = upd

    run: (options = {}) ->
      @getUpdater().run(options)

  App.reqres.setHandler "new:updater:entity", (attrs = {}) ->
    new Entities.Updater attrs