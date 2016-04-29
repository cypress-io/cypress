@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Browser extends Entities.Model
    mutators:
      icon: ->
        return "chrome" if @attributes.name is "chromium"
        @attributes.name

      displayName: ->
        _.str.capitalize(@attributes.name)

  class Entities.BrowsersCollection extends Entities.Collection
    model: Entities.Browser

    extractDefaultBrowser: ->
      defaultBrowser = @findWhere({default: true}) ? @first()
      @remove(defaultBrowser)
      return defaultBrowser

  API =
    newBrowsers: (browsers) ->
      new Entities.BrowsersCollection(browsers)

  App.reqres.setHandler "new:browser:entities", (browsers = []) ->
    API.newBrowsers(browsers)