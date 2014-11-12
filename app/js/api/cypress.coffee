## look at https://github.com/angular/angular.js/blob/master/src/ngScenario/browserTrigger.js
## for some references on creating simulated events

## make this a global to allow attaching / overriding
## we just need to set the patchEcl properties instead
## of using a partial
window.Cypress = do ($, _) ->

  commands =
    url: (partial) ->
      partial.$remoteIframe.prop("contentWindow").location.toString()

    filter: (partial, fn) ->
      unless @subject and _.isElement(@subject[0])
        throw new Error("Cannot call .filter() without first finding an element")

      @subject.filter(fn)

    first: (partial) ->
      unless @subject and _.isElement(@subject[0])
        throw new Error("Cannot call .first() without first finding an element")

      @subject.first()

    click: (partial) ->
      @subject.each (index, el) ->
        el.click()

    then: (partial, fn) ->
      ## to figure out whether or not to invoke then we just
      ## see if its the very last command, and its been passed
      ## two arguments, the second of which is called done
      ## if so its been added by mocha
      fn.call(@, @subject)

    find: (partial, selector, alias, options = {}) ->
      options = if _.isObject(alias) then alias else options

      _.defaults options,
        df: $.Deferred()
        retry: true
        timeout: 2000
        total: 0

      df.reject("Timed out trying to find element: #{selector}") if options.total >= options.timeout

      $el = new $.fn.init(selector, partial.$remoteIframe.prop("contentWindow").document)

      ## return the $el immediately if we've set not to retry
      ## or we found an element
      if $el.length or not options.retry
        options.df.resolve($el)
      else
        ## think about using @retry here to abstract away
        ## the delay + invocation + options.total increment
        _.delay =>
          @invoke(@current, partial, selector, alias, options)
        , options.total += 50

      return options.df

    type: (partial, sequence, options = {}) ->
      unless @subject and _.isElement(@subject[0])
        throw new Error("Cannot call .type() without first finding an element")

      _.extend options,
        sequence: sequence

      @subject.simulate "key-sequence", options

    clear: (partial) ->
      unless @subject and _.isElement(@subject[0])
        throw new Error("Cannot call .clear() without first finding an element")

      ## on input, then type "" as its value
      ## on select, clear its selected option

    select: (partial, valueOrText) ->
      unless @subject and _.isElement(@subject[0])
        throw new Error("Cannot call .select() without first finding an element")

      ## if @subject is a <select> el assume we are filtering down its
      ## options to a specific option first by value and then by text
      ## we'll throw errors if more than one is found AND the select
      ## element is multiple=multiple

      ## if the subject isn't a <select> then we'll check to make sure
      ## this is an option
      ## if this is multiple=multiple then we'll accept an array of values
      ## or texts and clear the previous selections which matches jQuery's
      ## behavior

      if @subject.is("select")
        ## normalize valueOrText if its not an array
        valueOrText = [].concat(valueOrText)
        multiple    = @subject.prop("multiple")

        values  = []
        options = @subject.children().map (index, el) ->
          ## push the value in values array if its
          ## found within the valueOrText
          value = el.value
          values.push(value) if value in valueOrText

          ## return the elements text + value
          {
            value: value
            text: $(el).text()
          }

        ## if we couldn't find anything by value then attempt
        ## to find it by text and insert its value into values arr
        if not values.length
          _.each options.get(), (obj, index) ->
            values.push(obj.value) if obj.text in valueOrText

        ## if we didnt set multiple to true and
        ## we have more than 1 option to set then blow up
        if not multiple and values.length > 1
          throw new Error("Found more than one option that was matched by value or text: #{valueOrText.join(", ")}")

        @subject.val(values)

        ## yup manually create this change event
        ## 1.6.5. HTML event types
        ## scroll down the 'change'
        event = document.createEvent("HTMLEvents")
        event.initEvent("change", true, false)

        @subject.each (index, el) ->
          el.dispatchEvent(event)

    wait: (partial, fn, options = {}) ->
      _.defaults options,
        wait: 0
        df: $.Deferred()

      try
        ## invoke fn and make sure its truthy
        fn.call(@, @subject) and options.df.resolve(@subject)
      catch e
        ## this should prob match the runnable's timeout here
        ## we should reset the runnables timeout every time
        ## a command successfully runs and expose that as
        ## a configuration variable
        ## total timeout vs each individuals command timeout
        options.wait += 500

        options.df.reject(e) if options.wait >= 2000

        _.delay =>
          @invoke(@current.prev).done =>
            @invoke(@current, partial, fn, options)
        , 500

      return options.df

  class Cypress
    queue: []

    constructor: (@subject = null, @lastCommand = null) ->

    run: (index = 0) ->
      queue = @queue[index]

      ## if we're at the very end just return our instance
      return @ if not queue

      df = @set queue, @queue[index - 1], @queue[index + 1]
      df.done =>
        @run index + 1

    clearTimeout: (id) ->
      clearTimeout(id) if id
      return @

    set: (obj, prev, next) ->
      obj.prev = prev
      obj.next = next

      @current = obj

      @invoke(obj)

    invoke: (obj, args...) ->
      ## allow the invoked arguments to be overridden by
      ## passing them in explicitly
      ## else just use the arguments the command was
      ## originally created with
      args = if args.length then args else obj.args

      ## if the last argument is a function then instead of
      ## expecting this to be resolved we wait for that function
      ## to be invoked
      df = $.when(obj.fn.apply(obj.ctx, args))
      df.done (subject) =>
        @subject = subject
      df.fail (err) ->
        throw err
      # @trigger "set", subject

    retry: (args...) ->

    enqueue: (key, fn, args, obj) ->
      @clearTimeout(@runId)
      args.unshift(obj) if obj
      @queue.push {name: key, ctx: @, fn: fn, args: args}
      @runId = _.defer _(@run).bind(@)
      return @

    ## class method patch
    ## loops through each method and partials
    ## the runnable onto our prototype
    @patch = (obj, fns) ->

      ## we want to be able to pass in specific functions to patch here
      ## else use the default commands object
      _.each (fns or commands), (fn, key) ->
        Cypress.prototype[key] = (args...) ->
          @enqueue(key, fn, args, obj)

      ## whenever we see should that automatically should trigger us
      ## to build up a new chai.Assertion instance and proxy the methods
      ## to it
      # _.each ["should", "have", "be"], (chainable) ->
      #   Object.defineProperty Cypress.prototype, chainable,
      #     get: ->
      #       @enqueue chainable, @["_" + chainable], []

      return @

    ## remove all of the partialed functions from Cypress prototype
    @unpatch = (fns) ->
      fns = _(commands).keys().concat("hook", "sandbox")
      _.each (fns), (fn, obj) ->
        delete Cypress.prototype[fn]

    @hook = (name) ->
      ## simply store the current hook on our prototype
      Cypress.prototype.hook = name

    ## restores the queue after each test run
    @restore = ->
      Cypress.prototype.queue = []

  return Cypress
