## attach to Eclectus global
Eclectus.Dom = do ($, _) ->

  ## create a reusable jquery selector object for our iframes
  ## which utilitizes our parent jquery object with the iframe
  ## context.  this means our consumers dont have to have jquery
  ## included in their project, and any modifications they make
  ## to jquery will not affect our own internal use of it
  class Dom
    constructor: (@document, @channel, @runnable) ->
      # @selector = el
      # @$el = @$(el)

    $: (selector) ->
      new $.fn.init(selector, @document)

    ## if find is called and we already have a selector
    ## it means we're chaining and we need to set prevObject
    ## just like jQuery
    find: (el) ->
      @selector = el
      @$el = @$(el)

      ## clone the body and strip out any script tags
      body = @$("body").clone(true, true)
      body.find("script").remove()

      @channel.trigger "dom", @runnable,
        selector: @selector
        el:       @$(@selector)
        dom:      body
        method:   "find"

      return @

    type: (sequence, options = {}) ->
      _.extend options,
        sequence: sequence

      @$el.simulate "key-sequence", options

      ## clone the body and strip out any script tags
      body = @$("body").clone(true, true)
      body.find("script").remove()

      @channel.trigger "dom", @runnable,
        selector: @selector
        el:       @$(@selector)
        dom:      body
        method:   "type"

      return @

  return Dom