## TODO need to handle scoping inner commands when the outer command fails
## it doesnt make sense to fail the first .find and then fail all
## subsequent finds.  should probably display that these have been skipped
## or just dont display them at all

## attach to Eclectus global
Eclectus.Command = do ($, _) ->

  ## create a reusable jquery selector object for our iframes
  ## which utilitizes our parent jquery object with the iframe
  ## context.  this means our consumers dont have to have jquery
  ## included in their project, and any modifications they make
  ## to jquery will not affect our own internal use of it
  class Command
    constructor: (@document, @channel, @runnable) ->
      @id = _.uniqueId("command")
      # @selector = el
      # @$el = @$(el)

    $: (selector) ->
      new $.fn.init(selector, @document)

    ## if find is called and we already have a selector
    ## it means we're chaining and we need to set prevObject
    ## just like jQuery
    find: (el) ->
      @$el      = if @$el then @$el.find(el) else @$(el)
      @selector = @$el.selector

      ## clone the body and strip out any script tags
      body = @$("body").clone(true, true)
      body.find("script").remove()

      @channel.trigger "dom", @runnable,
        selector: @selector
        el:       @$(@selector)
        dom:      body
        method:   "find"

      return @

    within: (el, fn) ->
      @$el      = if @$el then @$el.find(el) else @$(el)
      @selector = @$el.selector

      ## clone the body and strip out any script tags
      body = @$("body").clone(true, true)
      body.find("script").remove()

      ## might want to strip out the previous selector here
      ## since we may not want to display that in our command view
      ## so instead of WITHIN #foo WITHIN #foo #bar WITHIN #foo #bar #baz
      ## we'd have WITHIN #foo WITHIN #bar WITHIN #baz
      @channel.trigger "dom", @runnable,
        selector: @selector
        el:       @$(@selector)
        dom:      body
        method:   "within"

      ## instead of patching all of these things here
      ## why wouldnt we just pass this instance around?
      ## that would probably work better with chaining
      ## call this scope? instead of patch?
      ## if obj instanceof Eclectus.Command then just use that
      ## else instatiate a new one
      ## ----------------------------------------------
      ## re-patch eclectus with this previous el object
      @scope()

      fn.call(@)

      ## then undo so commands after this are back to normal
      @unscope()

    type: (sequence, options = {}) ->
      #@pauseRunnable() if sequence is "walk the dog{enter}" and @runnable.cid is "1lc"

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
        sequence: sequence

      # debugger

      return @

    ## should not talk directly to the runnable here
    ## need to go through the runner to do this?
    pauseRunnable: ->
      @runnable.async = true
      @runnable.sync = false
      ## unless i wrap this in a defer it wont
      ## actually clear the timeout
      ## gonna have to dig into mocha something is
      ## probably resetting the timeout
      _.defer =>
        @runnable.clearTimeout()

  return Command