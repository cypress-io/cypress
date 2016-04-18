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

  browsersData = [
    {
      "name": "chromium",
      "version": 49,
      "default": true
    },
    {
      "name": "chrome",
      "version": 41,
      "default": false
    }
  ]

  API =
    getDefaultBrowser: ->
      browser = new Entities.Browser((_.where(browsersData, {default: true}))[0])
      browser

    getBrowsers: ->
      browsers = new Entities.BrowsersCollection _.where(browsersData, {default: false})
      browsers

  App.reqres.setHandler "browser:entities", ->
    API.getBrowsers()

  App.reqres.setHandler "get:default:browser", ->
    API.getDefaultBrowser()