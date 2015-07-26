@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Nav extends Entities.Model
    initialize: ->
      new Backbone.Chooser(@)

  class Entities.NavsCollection extends Entities.Collection
    model: Entities.Nav

    initialize: ->
      new Backbone.SingleChooser(@)

    chooseByName: (nav) ->
      nav = @findWhere(name: nav)
      throw new Error("No nav found by the name: #{nav}") if not nav
      @choose nav

  API =
    getNavs: ->
      new Entities.NavsCollection [
        # {name: "Tests",     href: "#tests",                                      icon: "fa fa-code"}
        {name: "Tests",     href: "#organize",                                   icon: "fa fa-code"}
        {name: "Docs",      href: "https://github.com/cypress-io/cypress/wiki",  icon: "fa fa-graduation-cap", external: true}
        {name: "Settings",  href: "#settings",                                   icon: "fa fa-cog"}
      ]

  App.reqres.setHandler "nav:entities", ->
    API.getNavs()