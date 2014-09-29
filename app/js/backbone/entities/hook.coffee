@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Hook extends Entities.Model
    defaults: ->
      failed: false
      visible: true
      commands: App.request("command:entities")

    addCommand: (command, options) ->
      @get("commands").add command, options

    toggle: ->
      @set "visible", !@get("visible")

    anyFailed: ->
      @get("commands").anyFailed()

    failed: ->
      @set "failed", true

  class Entities.HooksCollection extends Entities.Collection
    model: Entities.Hook

    getByName: (name) ->
      @findWhere({name: name})

    addCommandToHook: (name, command, options) ->
      hook = @findOrCreateHookByName(name)
      hook.addCommand command, options

    findOrCreateHookByName: (name) ->
      return hook if hook = @getByName(name)
      @add({name: name})

    anyFailed: ->
      @any (hook) ->
        hook.anyFailed()

  App.reqres.setHandler "hook:entities", ->
    new Entities.HooksCollection