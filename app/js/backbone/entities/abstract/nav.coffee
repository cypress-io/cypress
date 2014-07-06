@Ecl.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Nav extends Entities.Model

  class Entities.NavsCollection extends Entities.Collection
    model: Entities.Nav

  API =
    getNavs: ->
      new Entities.NavsCollection [
        {name: "Tests",     href: "#", icon: "fa fa-code"}
        {name: "Organize",  href: "#", icon: "fa fa-th"}
        {name: "Analytics", href: "#", icon: "fa fa-bar-chart-o"}
        {name: "Settings",  href: "#", icon: "fa fa-cog"}
      ]

  App.reqres.setHandler "nav:entities", ->
    API.getNavs()