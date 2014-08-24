
## attach to Eclectus global
## this is our base command class the others will inherit from
Eclectus.Command = do ($, _) ->
  ## the attr which we use to find the dom element
  ## when we revert the DOM
  class Command
    highlightAttr: "data-eclectus-el"

    constructor: (@document, @channel, @runnable) ->
      ## this is the unique identifer of all instantiated
      ## commands.  so as we chain off of this id
      ## we can reference back up to the parent id
      ## we chained off of.
      @id = _.uniqueId("instance")

      ## call init passing up our arguments
      @initialize(arguments...) if @initialize

    $: (selector) ->
      new $.fn.init(selector, @document)

    getConfig: ->
      throw new Error("config must be set") if not @config

      config = _(@).result "config"

      throw new Error("config.type must be set") if not config.type

      _(config).defaults
        dom: true

    getDom: ->
      ## create a unique selector for this el
      @$el.attr(@highlightAttr, true) if @$el

      ## clone the body and strip out any script tags
      body = @$("body").clone(true, true)
      body.find("script").remove()

      ## now remove it after we clone
      @$el.removeAttr(@highlightAttr) if @$el

      return body

    emit: (obj) ->
      config = @getConfig()

      _.defaults obj,
        parent: @parent?.id
        length: @length
        highlightAttr: @highlightAttr
        id: @id
        selector: ""

      ## convert to a string always in case our arg was an object
      obj.selector = obj.selector.toString()

      ## add the dom to the object
      ## if its true in the config
      ## and its not already set
      obj.dom ?= @getDom() if config.dom

      @channel.trigger config.type, @runnable, obj

    clone: ->
      new @constructor(@document, @channel, @runnable)

  return Command