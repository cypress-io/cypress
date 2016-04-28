@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Browser extends Entities.Model

    mutators:
      icon: ->
        return "chrome" if @attributes.name is "chromium"
        @attributes.name

      nameCapitalized: ->
        _.str.capitalize(@attributes.name)

  class Entities.BrowsersCollection extends Entities.Collection
    model: Entities.Browser

    pullOffDefaultBrowser: ->
      defaultBrowser = @where({default: true})[0]
      @remove defaultBrowser
      return defaultBrowser

  API =
    getBrowsers: ->
      browsers = new Entities.BrowsersCollection
      App.ipc("get:browsers").then (brows) ->
        browsers.add brows
        browsers.trigger("fetched")
      browsers

  App.reqres.setHandler "browser:entities", ->
    API.getBrowsers()