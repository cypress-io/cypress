## look at https://github.com/angular/angular.js/blob/master/src/ngScenario/browserTrigger.js
## for some references on creating simulated events

## make this a global to allow attaching / overriding
window.Cypress = do ($, _) ->

  ## should attach these commands as defaultMethods and allow them
  ## to be configurable
  commands =
    inspect: ->
      @prop("inspect", true)

    url: ->
      @action "location", "href"

    filter: (fn) ->
      unless @prop("subject") and _.isElement(@prop("subject")[0])
        throw new Error("Cannot call .filter() without first finding an element")

      @prop("subject").filter(fn)

    ## add an array of jquery methods
    eq: ->

    ## allow the user to choose whether the confirmation
    ## message returns true or false.  need to patch
    ## window.confirm and store the last confirm message
    ## so we can async respond to it?
    confirm: (bool = true) ->

    noop: ->

    location: (key) ->
      currentUrl = window.location.toString()
      remoteUrl  = @$remoteIframe.prop("contentWindow").location.toString()
      remoteOrigin = @config("remoteOrigin")

      location = Cypress.location(currentUrl, remoteUrl, remoteOrigin)

      if key
        ## use existential here because we only want to throw
        ## on null or undefined values (and not empty strings)
        location[key] ?
          throw new Error("Location object does have not have key: #{key}")
      else
        location

    first: ->
      unless @prop("subject") and _.isElement(@prop("subject")[0])
        throw new Error("Cannot call .first() without first finding an element")

      @prop("subject").first()

    click: ->
      ## if subject is an anchor link then artificially
      ## add a delay of 100ms because the unload event
      ## may be firing async (soon)
      ## else just normally set a 10ms delay because clicking
      ## will generally cause some kind of DOM mutation which
      ## helps with async issues
      ## we should automatically invoke @each("click") for every
      ## member of the subject, so it logs out each one
      clicks = $.Deferred()

      dfs = []

      click = (index) =>
        el = @prop("subject").get(index)

        ## resolve the outer clicks deferred with our subject again
        return clicks.resolve(@prop("subject")) if not el

        el.click()

        wait = if $(el).is("a") then 100 else 10

        @delay dfs[index].resolve, wait# * 50

      @prop("subject").each (index, el) ->
        df = $.Deferred()
        df.done -> click(index + 1)
        dfs.push(df)

      click(0)

      return clicks

    # get: (name) ->
    #   @aliases[name] or
    #     throw new Error("No alias was found by the name: #{name}")

    eval: (code, options = {}) ->
      _.defaults options,
        timeout: 15000

      df = $.Deferred()

      ## obviously this needs to be moved to a separate method
      timeout = @prop("runnable").timeout()
      @prop("runnable").timeout(options.timeout)

      xhr = $.getJSON("/eval", {code: code}).done (response) =>
        @prop("runnable").timeout(timeout)

        resp = if response.obj then JSON.parse(response.obj) else response.text

        @alias(options.store, resp) if options.store

        df.resolve resp

      @prop "xhr", xhr

      df

    visit: (url, options = {}) ->
      options.rootUrl = @config("rootUrl")

      partial = _(@).pick "$remoteIframe", "channel", "contentWindow", "runnable"
      Eclectus.patch partial
      Ecl.visit(url, options)

    then: (fn) ->
      ## if this is the very last command we know its the 'then'
      ## called by mocha.  in this case, we need to defer its
      ## fn callback else we will not properly finish the run
      ## of our commands, which ends up duplicating multiple commands
      ## downstream.  this is because this fn callback forces mocha
      ## to continue synchronously onto tests (if for instance this
      ## 'then' is called from a hook) - by defering it, we finish
      ## resolving our deferred.
      return @defer(fn) if not @prop("current").next

      df = $.Deferred()

      try
        ret = fn.call(@prop("runnable").ctx, @prop("subject"))

        ## then will resolve with the fn's
        ## return or just pass along the subject
        df.resolve(ret or @prop("subject"))
      catch e
        df.reject(e)

      return df

    within: (selector, fn) ->

    options: (options = {}) ->
      ## change things like pauses in between commands
      ## the max timeout per command
      ## or anything else here...

    debug: ->
      console.log "\n%c------------------------Cypress Command Info------------------------", "font-weight: bold;"
      _.each ["options", "subject", "runnable", "queue", "index"], (item) =>
        console.log("#{item}: ", @prop(item))
      debugger

    pause: (int) ->
      int ?= 1e9

      @prop("runnable").timeout(int + 100)

      df = $.Deferred()

      @delay ->
        df.resolve()
      , int

      df

    find: (selector, alias, options = {}, fn ) ->
      # if fn
      #   eval
      #   any cy methods
      #   splice into the queue

      options = if _.isObject(alias) then alias else options

      _.defaults options,
        df: $.Deferred()
        retry: true
        timeout: 1000 ## this should not be hard coded here
        total: 0

      if options.total >= options.timeout
        options.df.reject("Timed out trying to find element: #{selector}")

      $el = new $.fn.init(selector, @$remoteIframe.prop("contentWindow").document)

      ## return the $el immediately if we've set not to retry
      ## or we found an element
      if $el.length or not options.retry
        options.df.resolve($el)
      else
        ## think about using @retry here to abstract away
        ## the delay + invocation + options.total increment
        options.total += 50

        @delay =>
          @invoke(@prop("current"), selector, alias, options)
        , 50

      return options.df

    type: (sequence, options = {}) ->
      unless @prop("subject") and _.isElement(@prop("subject")[0])
        throw new Error("Cannot call .type() without first finding an element")

      _.extend options,
        sequence: sequence

      @prop("subject").simulate "key-sequence", options

    clear: ->
      unless @prop("subject") and _.isElement(@prop("subject")[0])
        throw new Error("Cannot call .clear() without first finding an element")

      ## on input, selectall then del so it fires all appropriate key events
      ## on select, clear its selected option
      if @prop("subject").is("input,textarea")
        @action "type", "{selectall}{del}"

      return @prop("subject")

    select: (valueOrText) ->
      unless @prop("subject") and _.isElement(@prop("subject")[0])
        throw new Error("Cannot call .select() without first finding an element")

      ## if @prop("subject") is a <select> el assume we are filtering down its
      ## options to a specific option first by value and then by text
      ## we'll throw errors if more than one is found AND the select
      ## element is multiple=multiple

      ## if the subject isn't a <select> then we'll check to make sure
      ## this is an option
      ## if this is multiple=multiple then we'll accept an array of values
      ## or texts and clear the previous selections which matches jQuery's
      ## behavior

      if @prop("subject").is("select")
        ## normalize valueOrText if its not an array
        valueOrText = [].concat(valueOrText)
        multiple    = @prop("subject").prop("multiple")

        values  = []
        options = @prop("subject").children().map (index, el) ->
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

        @prop("subject").val(values)

        ## yup manually create this change event
        ## 1.6.5. HTML event types
        ## scroll down the 'change'
        event = document.createEvent("HTMLEvents")
        event.initEvent("change", true, false)

        @prop("subject").each (index, el) ->
          el.dispatchEvent(event)

    wait: (fn, options = {}) ->
      ## we set the initial wait to account for how long the test
      ## has already been running and we add 100 milliseconds so
      ## our wait times out before the runnable's timeout fires

      _.defaults options,
        total: 0
        start: new Date
        wait: 100
        df: $.Deferred()

      ## we always want to make sure we timeout before our runnable does
      ## so take its current timeout, subtract the total time its already
      ## been running and add the options.wait for a tiny bit of padding
      options.timeout ?= @prop("runnable").timeout() - (new Date - @prop("runnable").startedAt + options.wait)

      try
        ## invoke fn and make sure its not strictly false
        if fn.call(@prop("runnable").ctx, @prop("subject")) is false
          @retry(null, fn, options)
        else
          options.df.resolve(@prop("subject"))

      catch e
        @retry(e, fn, options)

      return options.df

  class Cypress
    queue: []

    constructor: (@options = {}) ->
      @props   = {}
      @aliases = {}

      _.defaults @options,
        commandTimeout: 2000
        delay: 0 ## whether there is a delay in between commands

    unregister: ->
      @props   = {}
      @aliases = {}

      return @

    prop: (key, val) ->
      if _.isUndefined(val)
        @props[key]
      else
        @props[key] = val

    ## global options applicable to all cy instances
    ## and restores
    options: (options = {}) ->

    isReady: (bool = true, event) ->
      if bool
        ## we set recentlyReady to true
        ## so we dont accidently set isReady
        ## back to false in between commands
        ## which are async
        @log "Ready due to: #{event}", "success"
        @prop("recentlyReady", true)
        return @prop("ready")?.resolve()

      ## if we already have a ready object and
      ## its state is pending just leave it be
      ## and dont touch it
      return if @prop("ready") and @prop("ready").state() is "pending"

      ## else set it to a deferred object
      @log "No longer ready due to: #{event}", "warning"
      @prop "ready", $.Deferred()

    run: ->
      ## start at 0 index if we dont have one
      index = @prop("index") ? @prop("index", 0)

      queue = @queue[index]

      @group(@prop("runnable").group)

      ## if we're at the very end just return our cy instance
      return @ if not queue

      df = @set queue, @queue[index - 1], @queue[index + 1]
      df.done =>
        ## each successful command invocation should
        ## always reset the timeout for the current runnable
        @prop("runnable").resetTimeout()

        ## mutate index by incrementing it
        ## this allows us to keep the proper index
        ## in between different hooks like before + beforeEach
        ## else run will be called again and index would start
        ## over at 0
        @prop("index", index += 1)
        @run index

    clearTimeout: (id) ->
      clearTimeout(id) if id
      return @

    alias: (name, value) ->
      @aliases[name] = value

    store: (name) ->
      @aliases[name] or
        throw new Error("No alias was found by the name: #{name}")

    storeHref: ->
      ## we are using href and stripping out the hash because
      ## hash changes do not cause full page refreshes
      ## however, i believe this will completely barf when
      ## JS users are using pushstate since there is no hash
      ## TODO. need to listen to pushstate events here which
      ## will act as the isReady() the same way load events do
      location = @action("location")
      @href    = location.href.replace(location.hash, "")

    hrefChanged: ->
      location = @action("location")
      @href isnt location.href.replace(location.hash, "")

    set: (obj, prev, next) ->
      obj.prev = prev
      obj.next = next

      @prop("current", obj)

      @invoke(obj)

    ## rethink / refactor nested promises
    invoke: (obj, args...) ->
      df = $.Deferred()

      ## make sure we're ready to invoke commands
      ## first by waiting until we're ready
      $.when(@prop("ready")).done =>
        @log obj

        ## store our current href before invoking the next command
        @storeHref()

        ## allow the invoked arguments to be overridden by
        ## passing them in explicitly
        ## else just use the arguments the command was
        ## originally created with
        args = if args.length then args else obj.args

        @prop "nestedIndex", @prop("index")

        ## if the last argument is a function then instead of
        ## expecting this to be resolved we wait for that function
        ## to be invoked
        fn = $.when(obj.fn.apply(obj.ctx, args))
        fn.done (subject, options = {}) =>

          ## if we havent become recently ready and unless we've
          ## explicitly disabled checking for location changes
          ## and if our href has changed in between running the commands then
          ## then we're no longer ready to proceed with the next command
          if @prop("recentlyReady") is null and options.checkLocation isnt false
            @isReady(false, "href changed") if @hrefChanged()

          ## reset the nestedIndex back to null
          @prop("nestedIndex", null)

          ## also reset recentlyReady back to null
          @prop("recentlyReady", null)

          ## should parse args.options here and figure
          ## out if we're using an alias
          df.resolve @prop("subject", subject)
        fn.fail (err) =>
          @log {name: "Failed: #{obj.name}", args: err.message}, "danger"
          console.error(err.stack)
          throw err

          ## this wont be invoked because we're throwing
          ## refactor these promises using another library
          ## to also handle try/catch using .catch
          df.reject(err)
          # @trigger "set", subject

      return df

    retry: (err, fn, options) ->
      ## we calculate the total time we've been retrying
      ## so we dont exceed the runnables timeout
      options.total = (new Date - options.start)

      if options.total >= options.timeout
        ## we may not have an err here in case wait
        ## simply evaluated to false
        ## prob should throw our own custom error
        ## we also need to change the error message
        ## to indicate that this TIMED OUT + the error
        return options.df.reject(err)

      @delay =>
        @invoke(@prop("current").prev).done =>
          @invoke(@prop("current"), fn, options)
      , options.wait

    action: (name, args...) ->
      commands[name].apply(@, args)

    defer: (fn) ->
      @delay(fn, 0)

    delay: (fn, ms) ->
      @clearTimeout(@prop("timerId"))
      @prop "timerId", _.delay(fn, ms)

    hook: (name) ->
      return if not @prop("inspect")

      return console.groupEnd() if not name

      console.group(name)

    group: (name) ->
      ## bail if we're not in inspect mode
      return if not @prop("inspect") or _.isUndefined(name)

      ## end the group if name is explicitly false
      return console.groupEnd() if name is false

      ## bail if we already have a _group set
      return if @_group

      ## set the _group
      @_group = name

      ## start a group by the name
      console.group(name)

    log: (obj, type) ->
      return if not @prop("inspect")

      color = {
        success: "#46B848"
        info:    "#5FC0DD"
        warning: "#D99538"
        danger:  "#D7514F"
      }[type] or "blue"

      if _.isString(obj)
        obj = {name: obj, args: ""}

      console.log "%c#{obj.name}", "color: #{color}", _.truncate(obj.args, 50)

    enqueue: (key, fn, args, options) ->
      @clearTimeout @prop("runId")

      obj = {name: key, ctx: @, fn: fn, args: args, options: options}

      ## if we have a nestedIndex it means we're processing
      ## nested commands and need to splice them into the
      ## index past the current index as opposed to
      ## pushing them to the end we also dont want to
      ## reset the run defer because splicing means we're
      ## already in a run loop and dont want to create another!
      ## we also reset the .next property to properly reference
      ## our new obj
      if nestedIndex = @prop("nestedIndex")
        @queue[nestedIndex].next = obj
        @queue.splice (@prop("nestedIndex", nestedIndex += 1)), 0, obj
      else
        @queue.push(obj)
        @prop "runId", @defer _(@run).bind(@)

      return @

    @commands = commands

    @add = (key, options, fn) ->
      ## if fn was omitted then we
      ## assume fn is the options
      if _.isUndefined(fn)
        fn = options
        options = {}

      @commands[key] = fn

      _.defaults options,
        logChildren: true
        log: true

      ## need to pass the options into inject here
      @inject(key, fn, options)

    @inject = (key, fn, options = {}) ->
      Cypress.prototype[key] = (args...) ->
        @enqueue(key, fn, args, options)

    ## remove all of the partialed functions from Cypress prototype
    @unpatch = (fns) ->
      fns = _(commands).keys().concat("sandbox")
      _.each (fns), (fn, obj) ->
        delete Cypress.prototype[fn]

    @abort = ->
      @cy.isReady(false, "abort").reject()
      @cy.$remoteIframe?.off("submit unload load")
      @cy.prop("runnable")?.clearTimeout()
      @cy.prop("xhr")?.abort()
      @restore()

    ## restores cypress after each test run by
    ## removing the queue from the proto and
    ## removing additional own instance properties
    @restore = ->
      @cy.clearTimeout @cy.prop("runId")
      @cy.clearTimeout @cy.prop("timerId")

      Cypress.prototype.queue = []

      ## remove any outstanding groups
      ## for any open hooks and runnables
      @cy.group(false)
      @cy.group(false)

      ## removes any registered props from the
      ## instance
      @cy.unregister()

      return @

    ## removes channel, remoteIframe, contentWindow
    ## from the cypress instance
    @stop = ->
      @abort()
      @restore()

      _.extend @cy,
        contentWindow: null
        remoteIframe:  null
        channel:       null
        config:        null

      window.cy = @cy = null

      return @

    ## sets the runnable onto the cy instance
    @set = (runnable, hook) ->
      @cy.hook(hook)
      @cy.prop("runnable", runnable)

    ## patches the cypress instance with contentWindow
    ## remoteIframe and channel
    ## this should be moved to an instance method and
    @setup = (contentWindow, $remoteIframe, channel, config) ->
      ## we listen for the unload + submit events on
      ## the window, because when we receive them we
      ## tell cy its not ready and this prevents any
      ## additional invocations of any commands until
      ## its ready again (which happens after the load
      ## event)
      bindEvents = ->
        win = $($remoteIframe.prop("contentWindow"))
        win.off("submit").on "submit", (e) =>
          ## if we've prevented the default submit action
          ## without stopping propagation, we will still
          ## receive this event even though the form
          ## did not submit
          return if e.isDefaultPrevented()

          @cy.isReady(false, "submit")

        win.off("unload").on "unload", =>
          ## put cy in a waiting state now that
          ## we've unloaded
          @cy.isReady(false, "unload")

        win.get(0).confirm = (message) ->
          console.info "Confirming 'true' to: ", message
          return true

      $remoteIframe.on "load", =>
        bindEvents()
        @cy.isReady(true, "load")

      _.extend @cy,
        contentWindow: contentWindow
        $remoteIframe: $remoteIframe
        channel:       channel
        config:        config

      ## anytime setup is called we immediately
      ## set cy to be ready to invoke commands
      ## this prevents a bug where we go into not
      ## ready mode due to the unload event when
      ## our tests are re-run
      @cy.isReady(true, "setup")

    @start = ->
      _.each @commands, (fn, key) =>
        @inject(key, fn)

      window.cy = @cy = new Cypress

      ## return the class as opposed to the
      ## instance so we dont have to worry about
      ## accidentally chaining the 'then' method
      ## during tests
      return @

  return Cypress
