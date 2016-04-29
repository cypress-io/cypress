@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Browser extends Entities.Model
    mutators:
      icon: ->
        switch @attributes.name
          when "chrome", "chromium" then "chrome"

      displayName: ->
        _.str.capitalize(@attributes.name)

  class Entities.BrowsersCollection extends Entities.Collection
    model: Entities.Browser

    chooseBrowserByName: (name) ->
      chosen = @findWhere({chosen: true})

      return chosen if chosen.get("name") is name

      chosen.unset("chosen")

      @findWhere({name: name}).set("chosen", true)

    extractDefaultBrowser: ->
      chosenBrowser = @findWhere({default: true}) ? @first()
      chosenBrowser.set({chosen: true})
      chosenBrowser

  API =
    newBrowsers: (browsers) ->
      new Entities.BrowsersCollection(browsers)

  App.reqres.setHandler "new:browser:entities", (browsers = []) ->
    API.newBrowsers(browsers)