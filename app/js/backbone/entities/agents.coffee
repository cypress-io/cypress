@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Agent extends Entities.Model

  class Entities.AgentsCollection extends Entities.Collection
    model: Entities.Agent

    # increment: (routeObj) ->
    #   route = @find (route) ->
    #     route.hasAgent(routeObj)

    #   route.increment() if route

    createAgent: (log) ->
      attrs = ["testId", "hook", "type", "functionName", "callCount"]

      agent = new Entities.Agent log.pick.apply(log, attrs)
      agent.log = log

      agent.listenTo log, "attrs:changed", (attrs) ->
        agent.set attrs

      agent

    add: (attrs, options) ->
      agent = attrs

      ## if we have both of these methods assume this is
      ## a backbone model
      if @isModelInstance(agent)

        ## increment the number if its not cloned
        # agent.increment(@maxNumber())

        return super(agent, options)

      return if _.isEmpty attrs

      super @createAgent(attrs)

  App.reqres.setHandler "agent:entities", ->
    new Entities.AgentsCollection