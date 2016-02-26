@App.module "ProjectsApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Project extends App.Views.ItemView
    template: "projects/show/project"

    modelEvents:
      "rebooted"         : "render"
      "change:clientUrl" : "render"
      "change:error"     : "render"

    triggers:
      "click a"           : "client:url:clicked"
      "click [data-stop]" : "stop:clicked"
      "click [data-ok]"   : "ok:clicked"

    onShow: ->
      $("html").addClass("project-show")

    onDestroy: ->
      $("html").removeClass("project-show")