@App.module "TestAgentsApp.List", (List, App, Backbone, Marionette, $, _) ->

  class List.Controller extends App.Controllers.Application
    initialize: (options) ->
      { test } = options

      @agents = agents = test.get("agents")

      agentsView = @getAgentsView agents

      @show agentsView

    onDestroy: ->
      @agents.reset([], {silent: true})

    getAgentsView: (agents) ->
      new List.Agents
        collection: agents
