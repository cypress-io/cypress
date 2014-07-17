@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Nav extends Entities.Model

  class Entities.NavsCollection extends Entities.Collection
    model: Entities.Nav

  API =
    getNavs: ->
      new Entities.NavsCollection [
        {name: "Tests",     href: "#tests",       icon: "fa fa-code"}
        {name: "Organize",  href: "#organize",   icon: "fa fa-th"}
        {name: "Analytics", href: "#analytics",  icon: "fa fa-bar-chart-o"}
        {name: "Settings",  href: "#settings",   icon: "fa fa-cog"}
      ]

  App.reqres.setHandler "nav:entities", ->
    API.getNavs()