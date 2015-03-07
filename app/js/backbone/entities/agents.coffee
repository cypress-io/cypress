@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Agent extends Entities.Model
    defaults: ->
      numCalls: 0

  class Entities.AgentsCollection extends Entities.Collection
    model: Entities.Agent

    # increment: (routeObj) ->
    #   route = @find (route) ->
    #     route.hasAgent(routeObj)

    #   route.increment() if route

    createAgent: (attrs) ->
      agent         = new Entities.Agent(attrs)
      # agent._agent  = attrs._agent
      agent

    add: (attrs, options) ->
      agent = attrs

      ## if we have both of these methods assume this is
      ## a backbone model
      if agent and agent.set and agent.get

        ## increment the number if its not cloned
        # agent.increment(@maxNumber())

        return super(agent, options)

      return if _.isEmpty attrs

      super @createAgent(attrs)

  App.reqres.setHandler "agent:entities", ->
    new Entities.AgentsCollection