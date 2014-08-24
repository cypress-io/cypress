## attach to Eclectus global

## this is our base command class the others will inherit from
Eclectus.Command = do ($, _) ->
  class Command
    constructor: (@document, @channel, @runnable) ->
      ## this is the unique identifer of all instantiated
      ## commands.  so as we chain off of this instanceId
      ## we can reference back up to the parent instanceId
      ## we chained off of.
      @instanceId = _.uniqueId("instance")

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
      @$el.attr("data-eclectus-el", true)

      ## clone the body and strip out any script tags
      body = @$("body").clone(true, true)
      body.find("script").remove()

      ## now remove it after we clone
      @$el.removeAttr("data-eclectus-el")

      return body

    emit: (obj) ->
      config = @getConfig()

      ## add the dom to the object
      ## if its true in the config
      ## and its not already set
      obj.dom ?= @getDom() if config.dom

      ## set instanceId if not already set
      obj.instanceId ?= @instanceId

      @channel.trigger config.type, @runnable, obj

    clone: ->
      new @constructor(@document, @channel, @runnable)

  return Command