@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Dom extends Entities.Model
    initialize: ->
      new Backbone.Chooser(@)

  class Entities.DomsCollection extends Entities.Collection
    model: Entities.Dom

    initialize: ->
      new Backbone.MultiChooser(@)

    ## msg should be a mutator
    getMsg: (el, node) ->
      found = el.length
      a = ["'#{node}'"]
      a.push if found then "found" else "not found"
      a.join(" ")

    add: (attrs = {}, runnable) ->
      {@el, @dom} = attrs

      attrs = _(attrs).pick("method")
      _.extend attrs,
        node: @el.prop("nodeName").toLowerCase()
        title: runnable.originalTitle()
        testId: runnable.cid

      attrs.msg = @getMsg(@el, attrs.node)

      super attrs

  App.reqres.setHandler "dom:entities", ->
    new Entities.DomsCollection