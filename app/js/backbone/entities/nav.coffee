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
        {name: "Tests",       href: "#tests",                               icon: "fa fa-code"}
        # {name: "Builds",    href: "#builds",                              icon: "fa fa-th"}
        # {name: "Analytics", href: "#analytics",                           icon: "fa fa-bar-chart-o"}
        # {name: "Settings",  href: "#settings",                            icon: "fa fa-cog"}
        {name: "Docs",        href: "https://on.cypress.io",                icon: "fa fa-graduation-cap", external: true}
        {name: "Chat",        href: "#",                                    icon: "fa fa-comments",       class: "gitter-open"}
      ]

  App.reqres.setHandler "nav:entities", ->
    API.getNavs()