@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Dom extends Entities.Model
    initialize: ->
      new Backbone.Chooser(@)

    getDom: ->
      @dom

    getEl: ->
      @el

  class Entities.DomsCollection extends Entities.Collection
    model: Entities.Dom

    initialize: ->
      new Backbone.MultiChooser(@)

    ## msg should be a mutator
    # getMsg: (el, node) ->
    #   found = el.length
    #   a = ["'#{node}'"]
    #   a.push if found then "found" else "not found"
    #   a.join(" ")

    add: (attrs = {}, runnable) ->
      {el, dom} = attrs

      # console.warn "add", @, attrs, @el, @dom

      attrs = _(attrs).pick("method", "selector")

      _.extend attrs,
        selector: attrs.selector.toLowerCase()
        title:    runnable.originalTitle()
        parent:   runnable.parent?.originalTitle()
        testId:   runnable.cid

      # attrs.msg = @getMsg(el, attrs.selector)

      attrs.error = "could not find: #{attrs.selector}" if not el.length

      ## highlight if we dont have errors
      attrs.highlight = !attrs.error

      ## create the model
      model = super attrs

      ## add these backed up properties
      model.el = el
      model.dom = dom

      return model

  App.reqres.setHandler "dom:entities", ->
    new Entities.DomsCollection