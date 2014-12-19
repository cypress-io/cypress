## look at https://github.com/angular/angular.js/blob/master/src/ngScenario/browserTrigger.js
## for some references on creating simulated events

## make this a global to allow attaching / overriding
window.Cypress = do ($, _) ->

  ngPrefixes = ['ng-', 'ng_', 'data-ng-', 'x-ng-']

  proxies = ["each", "map", "filter", "children", "eq", "closest", "first", "last", "next", "parent", "parents", "prev", "siblings"]

  validHttpMethodsRe = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/

  ## should attach these commands as defaultMethods and allow them
  ## to be configurable
  commands =
    server: (args...) ->
      ## server accepts multiple signatures
      ## so lets normalize the arguments
      switch
        when not args.length
          options = {}
        when _.isFunction(args[0])
          options = {
            onRequest: args[0]
            onResponse: args[1]
          }
        when _.isObject(args[0])
          options = args[0]
        else
          @throwErr(".server() only accepts a single object literal or 2 callback functions!")

      ## get a handle on our sandbox
      sandbox = @_getSandbox()

      ## start up the fake server to slurp up
      ## any XHR requests from here on out
      server = sandbox.useFakeServer()

      ## pass in our server + options and store this
      ## this server so we can access it later
      @prop "server", Cypress.server(server, options)

    route: (args...) ->
      ## bail if we dont have a server prop
      @throwErr("cy.route() cannot be invoked before starting the cy.server()") if not @prop("server")

      defaults = {
        method: "GET"
        response: {}
      }

      options = o = {}

      switch
        when _.isObject(args[0])
          _.extend options, args[0]
        when args.length is 2
          o.url        = args[0]
          o.response   = args[1]
        when args.length is 3
          if _.isFunction _(args).last()
            o.url       = args[0]
            o.response  = args[1]
            o.onRequest = args[2]
          else
            o.method    = args[0]
            o.url       = args[1]
            o.response  = args[2]
        else
          if _.isFunction _(args).last()
            lastIndex = args.length - 1

            if _.isFunction(args[lastIndex - 1]) and args.length is 4
              o.url        = args[0]
              o.response   = args[1]
              o.onRequest  = args[2]
              o.onResponse = args[3]

            else
              o.method     = args[0]
              o.url        = args[1]
              o.response   = args[2]
              o.onRequest  = args[3]
              o.onResponse = args[4]

      if _.isString(o.method)
        o.method = o.method.toUpperCase()

      _.defaults options, defaults

      if not options.url
        @throwErr "cy.route() must be called with a url. It can be a string or regular expression."

      if not (_.isString(options.url) or _.isRegExp(options.url))
        @throwErr "cy.route() was called with a invalid url. Url must be either a string or regular expression."

      if not validHttpMethodsRe.test(options.method)
        @throwErr "cy.route() was called with an invalid method: '#{o.method}'.  Method can only be: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS"

      @prop("server").stub(options)

    clearLocalStorage: (keys) ->
      ## bail if we have keys and we're not a string and we're not a regexp
      if keys and not _.isString(keys) and not _.isRegExp(keys)
        @throwErr("cy.clearLocalStorage() must be called with either a string or regular expression!")

      local = window.localStorage
      remote = cy._window().localStorage

      ## set our localStorage and the remote localStorage
      Cypress.LocalStorage.setStorages(local, remote)

      ## clear the keys
      Cypress.LocalStorage.clear(keys)

      ## and then unset the references
      Cypress.LocalStorage.unsetStorages()

    inspect: ->
      ## bug fix due to 3rd party libs like
      ## chai using inspect function for
      ## special display
      # return "" if not @prop

      @prop("inspect", true)

    url: ->
      @_url()

    fill: (obj, options = {}) ->
      @throwErr "cy.fill() must be passed an object literal as its 1st argument!" if not _.isObject(obj)

    contains: (filter, text, options = {}) ->
      switch
        when _.isObject(text)
          options = text
          text = filter
          filter = ""
        when _.isUndefined(text)
          text = filter
          filter = ""

      word = if filter then "the selector: <#{filter}>" else "any elements"
      options.error = "Could not find #{word} containing the content: #{text}"

      ## find elements by the :contains psuedo selector
      ## and any submit inputs with the attributeContainsWord selector
      selector = "#{filter}:contains('#{text}'), #{filter}[type='submit'][value~='#{text}']"

      @_action("find", selector, options).then (elements) ->
        for filter in ["input[type='submit']", "button", "a"]
          filtered = elements.filter(filter)
          return filtered if filtered.length

        return elements.last()

    check: (values = []) ->
      ## make sure we're an array of values
      values = [].concat(values)

      subject = @_ensureDomSubject()

      ## blow up if any member of the subject
      ## isnt a checkbox or radio
      subject.each (index, el) =>
        el = $(el)
        node = @_stringifyElement(el)

        if not el.is(":checkbox,:radio")
          word = @_plural(subject, "contains", "is")
          @throwErr(".check() can only be called on :checkbox and :radio! Your subject #{word} a: #{node}")

        return if el.prop("checked")

        ## if we didnt pass in any values or our
        ## el's value is in the array then check it
        if not values.length or el.val() in values
          el.prop("checked", true).trigger("change")

    uncheck: (values = []) ->
      ## make sure we're an array of values
      values = [].concat(values)

      subject = @_ensureDomSubject()

      ## blow up if any member of the subject
      ## isnt a checkbox
      subject.each (index, el) =>
        el = $(el)
        node = @_stringifyElement(el)

        if not el.is(":checkbox")
          word = @_plural(subject, "contains", "is")
          @throwErr(".uncheck() can only be called on :checkbox! Your subject #{word} a: #{node}")

        return if not el.prop("checked")

        ## if we didnt pass in any values or our
        ## el's value is in the array then check it
        if not values.length or el.val() in values
          el.prop("checked", false).trigger("change")

    ## allow the user to choose whether the confirmation
    ## message returns true or false.  need to patch
    ## window.confirm and store the last confirm message
    ## so we can async respond to it?
    confirm: (bool = true) ->

    ## saves the current subject as an alias
    save: (str) ->
      @alias str, @_subject()

    noop: (obj) -> obj

    ng: (type, selector, options = {}) ->
      @throwErr "Angular global was not found in your window! You cannot use .ng() methods without angular." if not @_window().angular

      switch type
        when "model"
          @_findByNgAttr("model", "model=", selector, options)
        when "repeater"
          @_findByNgAttr("repeater", "repeat*=", selector, options)
        when "binding"
          @_findByNgBinding(selector, options)

    click: ->
      subject = @_ensureDomSubject()

      click = (memo, el, index) =>
        wait = if $(el).is("a") then 50 else 10

        memo.then =>
          el.click()

          ## we want to add this wait delta to our
          ## runnables timeout so we prevent it from
          ## timing out from multiple clicks
          @_timeout(wait, true)

          ## need to return null here to prevent
          ## chaining thenable promises
          return null

        .delay(wait)

      ## create a new promise and chain off of it using reduce to insert
      ## the artificial delays.  we have to set this as cancellable for it
      ## to propogate since this is an "inner" promise
      clicks = _.reduce subject.toArray(), click, Promise.resolve().cancellable()

      ## return our original subject when our promise resolves
      clicks.return(subject)

      ## -- this does not work but may work in the future -- ##
      # Promise
      #   .each subject.toArray(), click
      #   .return(subject)

    eval: (code, options = {}) ->
      _.defaults options,
        timeout: 15000

      ## obviously this needs to be moved to a separate method
      prevTimeout = @_timeout()
      @_timeout(options.timeout)

      ## this should probably become a queue of xhr's which we abort
      ## iterative during Cypress.abort()
      ## and we splice ourselves out of the xhr array on success
      xhr = @prop "xhr", $.getJSON("/eval", {code: code})
      Promise.resolve(xhr)
        .then (response) =>
          @_timeout(prevTimeout)
          return response

    visit: (url, options = {}) ->
      _.defaults options,
        timeout: 15000
        onBeforeLoad: ->
        onLoad: ->

      ## trigger that the remoteIframing is visiting
      ## an external URL
      @$remoteIframe.trigger "visit:start", url

      rootUrl = @config("rootUrl")
      url     = Cypress.Location.getRemoteUrl(url, rootUrl)

      ## backup the previous runnable timeout
      ## and the hook's previous timeout
      prevTimeout     = @_timeout()

      ## reset the timeout to our options
      @_timeout(options.timeout)

      win = @_window()

      new Promise (resolve, reject) =>
        ## if we're visiting a page and we're not currently
        ## on about:blank then we need to nuke the window
        ## and after its nuked then visit the url
        if @_url() isnt "about:blank"
          win.location.href = "about:blank"

          @$remoteIframe.one "load", =>
            visit(win, url, options)

        else
          visit(win, url, options)

        visit = (win, url, options) =>
          # ## when the remote iframe's load event fires
          # ## callback fn
          @$remoteIframe.one "load", =>
            @_storeHref()
            @_timeout(prevTimeout)
            options.onLoad?(win)
            resolve(win)

          # ## any existing global variables will get nuked after it navigates
          @$remoteIframe.prop "src", Cypress.Location.createInitialRemoteSrc(url)

    ## thens can return more "thenables" which are not resolved
    ## until they're 'really' resolved, so naturally this API
    ## supports nesting promises
    then: (fn) ->
      ## if this is the very last command we know its the 'then'
      ## called by mocha.  in this case, we need to defer its
      ## fn callback else we will not properly finish the run
      ## of our commands, which ends up duplicating multiple commands
      ## downstream.  this is because this fn callback forces mocha
      ## to continue synchronously onto tests (if for instance this
      ## 'then' is called from a hook) - by defering it, we finish
      ## resolving our deferred.
      if not @prop("current").next and @prop("current").args.length is 2
        return @prop("next", fn)

      ## we need to wrap this in a try-catch still (even though we're
      ## using bluebird) because we want to handle the return by
      ## allow the 'then' to change the subject to the return value
      ## if its a non null/undefined value else to return the subject
      try
        ret = fn.call @prop("runnable").ctx, @prop("subject")

        ## then will resolve with the fn's
        ## return or just pass along the subject
        return ret ? @prop("subject")
      catch e
        throw e

    within: (selector, fn) ->

    options: (options = {}) ->
      ## change things like pauses in between commands
      ## the max timeout per command
      ## or anything else here...

    debug: ->
      console.log "\n%c------------------------Cypress Command Info------------------------", "font-weight: bold;"
      _.each ["options", "subject", "runnable", "queue", "index"], (item) =>
        console.log "#{item}: ", (@prop(item) or @[item])
      debugger

    find: (selector, options = {}) ->
      _.defaults options,
        retry: true

      $el = @$(selector)

      ## allow retry to be a function which we ensure
      ## returns truthy before returning its
      if _.isFunction(options.retry)
        return ret if ret = options.retry.call(@, $el)
      else
        ## return the el if it has a length or we've explicitly
        ## disabled retrying
        return $el if $el.length or options.retry is false

      retry = ->
        @_action("find", selector, options)

      options.error ?= "Could not find element: #{selector}"

      @_retry(retry, options)

    title: (options = {}) ->
      ## using call here to invoke the 'text' method on the
      ## title's jquery object
      @_action("find", "title", options).call("text")

    location: ->
      ## just use the sync version
      @_location()

    window: ->
      ## just use the sync version
      @_window()

    document: ->
      ## just use the sync version
      @_document()

    doc: -> @_document()

    type: (sequence, options = {}) ->
      subject = @_ensureDomSubject()

      ## allow the el we're typing into to be
      ## changed by options
      _.defaults options,
        el: subject

      if not subject.is("textarea,:text")
        node = @_stringifyElement(options.el)
        @throwErr(".type() can only be called on textarea or :text! Your subject is a: #{node}")

      if (num = subject.length) and num > 1
        @throwErr(".type() can only be called on a single textarea or :text! Your subject contained #{num} elements!")

      options.sequence = sequence

      options.el.simulate "key-sequence", options

      return subject

    clear: (options = {}) ->
      ## what about other types of inputs besides just text?
      ## what about the new HTML5 ones?

      subject = @_ensureDomSubject()

      ## blow up if any member of the subject
      ## isnt a textarea or :text
      subject.each (index, el) =>
        el = $(el)
        node = @_stringifyElement(el)

        if not el.is("textarea,:text")
          word = @_plural(subject, "contains", "is")
          @throwErr(".clear() can only be called on textarea or :text! Your subject #{word} a: #{node}")

        @_action "type", "{selectall}{del}", {el: el}

    select: (valueOrText, options = {}) ->
      subject = @_ensureDomSubject()

      ## if @_subject() is a <select> el assume we are filtering down its
      ## options to a specific option first by value and then by text
      ## we'll throw if more than one is found AND the select
      ## element is multiple=multiple

      ## if the subject isn't a <select> then we'll check to make sure
      ## this is an option
      ## if this is multiple=multiple then we'll accept an array of values
      ## or texts and clear the previous selections which matches jQuery's
      ## behavior

      if not subject.is("select")
        node = @_stringifyElement(subject)
        @throwErr ".select() can only be called on a <select>! Your subject is a: #{node}"

      if (num = subject.length) and num > 1
        @throwErr ".select() can only be called on a single <select>! Your subject contained #{num} elements!"

      ## normalize valueOrText if its not an array
      valueOrText = [].concat(valueOrText)
      multiple    = subject.prop("multiple")

      ## throw if we're not a multiple select and we've
      ## passed an array of values
      if not multiple and valueOrText.length > 1
        @throwErr ".select() was called with an array of arguments but does not have a 'multiple' attribute set!"

      values  = []
      options = subject.children().map (index, el) ->
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
        @throwErr(".select() matched than one option by value or text: #{valueOrText.join(", ")}")

      subject.val(values)

      ## yup manually create this change event
      ## 1.6.5. HTML event types
      ## scroll down the 'change'
      event = document.createEvent("HTMLEvents")
      event.initEvent("change", true, false)

      subject.get(0).dispatchEvent(event)

      return subject

    wait: (msOrFn, options = {}) ->
      msOrFn ?= 1e9

      switch
        when _.isNumber(msOrFn)
          ## increase the timeout by the delta
          @_timeout(msOrFn, true)
          return Promise.delay(msOrFn)

        when _.isFunction(msOrFn)
          fn = msOrFn

          retry = ->
            ## should check here to make sure we have a .prev
            ## and if not we should throwErr
            @invoke2(@prop("current").prev).then =>
              @invoke2(@prop("current"), fn, options)

          try
            ## invoke fn and make sure its not strictly false
            options.value = fn.call(@prop("runnable").ctx, @prop("subject"))
            return @prop("subject") if options.value
          catch e
            options.error = "Could not continue due to: " + e
            return @_retry(retry, options)

          ## retry outside of the try / catch block because
          ## if retry throws errors we want those to bubble
          options.error = "The final value was: " + options.value
          return @_retry(retry, options) if not options.value

        else
          @throwErr "wait() must be invoked with either a number or a function!"

  _.each proxies, (t) ->
    commands[t] = (args...) ->
      subject = @_ensureDomSubject()

      subject[t].apply(subject, args)

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

    _ensureDomSubject: (modifier) ->
      subject = @_subject()

      modifier ?= @prop("current").name

      ## think about dropping the 'modifier' part
      ## and adding exactly what the subject is
      ## if its an object or array, just say Object or Array
      ## but if its a primitive, just print out its value like
      ## true, false, 0, 1, 3, "foo", "bar"
      (subject and subject.get and _.isElement(subject.get(0))) or
        @throwErr("Cannot use the modifier: .#{modifier}() on a non-DOM subject!")

      return subject

    _stringifyElement: (el) ->
      el = if _.isElement(el) then $(el) else el
      el.clone().empty().prop("outerHTML")

    _plural: (obj, plural, singular) ->
      obj = if _.isNumber(obj) then obj else obj.length
      if obj > 1 then plural else singular

    _window: ->
      @throwErr "The remote iframe is undefined!" if not @$remoteIframe
      @$remoteIframe.prop("contentWindow")

    _document: ->
      win = @_window()
      @throwErr "The remote iframe's document is undefined!" if not win.document
      $(win.document)

    _location: (key) ->
      currentUrl = window.location.toString()
      remoteUrl  = @_window().location.toString()
      remoteOrigin = @config("remoteOrigin")

      location = Cypress.location(currentUrl, remoteUrl, remoteOrigin)

      if key
        ## use existential here because we only want to throw
        ## on null or undefined values (and not empty strings)
        location[key] ?
          @throwErr("Location object does have not have key: #{key}")
      else
        location

    _url: ->
      @_location("href")

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

        if ready = @prop("ready")
          ready.promise.then =>
            @trigger "ready", true

            ## prevent accidential chaining
            ## .this after isReady resolves
            return null

        return ready?.resolve()

      ## if we already have a ready object and
      ## its state is pending just leave it be
      ## and dont touch it
      return if @prop("ready") and @prop("ready").promise.isPending()

      ## else set it to a deferred object
      @log "No longer ready due to: #{event}", "warning"

      @trigger "ready", false

      @prop "ready", Promise.pending()

    run: ->
      ## start at 0 index if we dont have one
      index = @prop("index") ? @prop("index", 0)

      queue = @queue[index]

      runnable = @prop("runnable")

      @group(runnable.group)

      ## if we're at the very end
      if not queue

        ## trigger end event
        @trigger("end")

        ## and we should have a next property which
        ## holds mocha's .then callback fn
        if next = @prop("next")
          next()

        return @

      ## store the previous timeout
      prevTimeout = runnable.timeout()

      ## prior to running set the runnables
      ## timeout to 30s. this is useful
      ## because we may have to wait to begin
      ## running such as the case in angular
      runnable.timeout(30000)

      run = =>
        ## bail if we've changed runnables by the
        ## time this resolves
        return if @prop("runnable") isnt runnable

        @trigger "command:start", queue

        ## reset the timeout to what it used to be
        runnable.timeout(prevTimeout)

        promise = @set(queue, @queue[index - 1], @queue[index + 1]).then =>
          ## each successful command invocation should
          ## always reset the timeout for the current runnable
          runnable.resetTimeout()

          ## mutate index by incrementing it
          ## this allows us to keep the proper index
          ## in between different hooks like before + beforeEach
          ## else run will be called again and index would start
          ## over at 0
          @prop("index", index += 1)

          @trigger "command:end"

          @defer => @run()

          ## must have this empty return here else we end up creating
          ## additional .then callbacks due to bluebird chaining
          return null

        .catch Promise.CancellationError, (err) =>
          @cancel(err)

          ## need to signify we're done our promise here
          ## so we cannot chain off of it, or have bluebird
          ## accidentally chain off of the return value
          return err

        .catch (err) =>
          @fail(err)

          return err
        ## signify we are at the end of the chain and do not
        ## continue chaining anymore
        # promise.done()

        @prop "promise", promise

        @trigger "set"

      ## automatically defer running each command in succession
      ## so each command is async
      @defer =>
        angular = @_window().angular

        if angular and angular.getTestability
          root = @$("[ng-app]").get(0)
          run = _.bind(run, @)
          angular.getTestability(root).whenStable(run)
        else
          run()

    clearTimeout: (id) ->
      clearTimeout(id) if id
      return @

    alias: (name, value) ->
      @aliases[name] = value
      @

    get: (name) ->
      alias = @aliases[name]
      return alias unless _.isUndefined(alias)

      ## instead of returning a function here and setting this
      ## invoke property, we should just convert this to a deferred
      ## and then during the actual save we should find out anystanding
      ## 'get' promises that match the name and then resolve them.
      ## the problem with this is we still need to run this anonymous
      ## function to check to see if we have an alias by that name
      ## else our alias will never resolve (if save is never called
      ## by this name argument)
      fn = =>
        @aliases[name] or
          @throwErr("No alias was found by the name: #{name}")
      fn._invokeImmediately = true
      fn

    _storeHref: ->
      ## we are using href and stripping out the hash because
      ## hash changes do not cause full page refreshes
      ## however, i believe this will completely barf when
      ## JS users are using pushstate since there is no hash
      ## TODO. need to listen to pushstate events here which
      ## will act as the isReady() the same way load events do
      location = @_location()
      @prop "href", location.href.replace(location.hash, "")

    _hrefChanged: ->
      location = @_location()
      @prop("href") isnt location.href.replace(location.hash, "")

    _subject: ->
      subject = @prop("subject") ?
        @throwErr("Subject is #{subject}!")

    _timeout: (ms, delta = false) ->
      runnable = @prop("runnable")
      @throwErr("Cannot call .timeout() without a currently running test!") if not runnable
      if ms
        ## if delta is true then we add (or subtract) from the
        ## runnables current timeout instead of blanketingly setting it
        ms = if delta then runnable.timeout() + ms else ms
        runnable.timeout(ms)
        return @
      else
        runnable.timeout()

    set: (obj, prev, next) ->
      obj.prev = prev
      obj.next = next

      @prop("current", obj)

      @invoke2(obj)

    invoke2: (obj, args...) ->
      promise = if @prop("ready")
        Promise.resolve @prop("ready").promise
      else
        Promise.resolve()

      promise.cancellable().then =>
        @trigger "invoke:start", obj

        @log obj

        ## store our current href before invoking the next command
        @_storeHref()

        @prop "nestedIndex", @prop("index")

        ## allow the invoked arguments to be overridden by
        ## passing them in explicitly
        ## else just use the arguments the command was
        ## originally created with
        if args.length then args else obj.args

      ## allow promises to be used in the arguments
      ## and wait until they're all resolved
      .all(args)

      .then (args) =>
        ## if the first argument is a function and it has an _invokeImmediately
        ## property that means we are supposed to immediately invoke
        ## it and use its return value as the argument to our
        ## current command object
        if _.isFunction(args[0]) and args[0]._invokeImmediately
          args[0] = args[0].call(@)

        ## we cannot pass our cypress instance back into
        ## bluebird else it will create a thenable which
        ## is never resolved
        ret = obj.fn.apply(obj.ctx, args)
        if ret is @ then @_subject() else ret

      .then (subject, options = {}) =>
        ## trigger an event here so we know our
        ## command has been successfully applied
        ## and we've potentially altered the subject
        @trigger "invoke:subject", subject, obj

        # if we havent become recently ready and unless we've
        # explicitly disabled checking for location changes
        # and if our href has changed in between running the commands then
        # then we're no longer ready to proceed with the next command
        if @prop("recentlyReady") is null
          @isReady(false, "href changed") if @_hrefChanged()

        ## reset the nestedIndex back to null
        @prop("nestedIndex", null)

        ## also reset recentlyReady back to null
        @prop("recentlyReady", null)

        ## return the prop subject
        @prop("subject", subject)

        @trigger "invoke:end", obj

        return subject

    throwErr: (err) ->
      if _.isString(err)
        err = new Error(err)

      throw err

    cancel: (err) ->
      obj = @prop("current")
      @log {name: "Cancelled: #{obj.name}", args: err.message}, "danger"
      @trigger "cancel", obj

    fail: (err) ->
      obj = @prop("current")
      @log {name: "Failed: #{obj.name}", args: err.message}, "danger"
      @runner.uncaught(err)
      @trigger "fail", err

    _retry: (fn, options) ->
      ## remove the runnables timeout because we are now in retry
      ## mode and should be handling timing out ourselves and dont
      ## want to accidentally time out via mocha
      if not options.runnableTimeout
        prevTimeout = @_timeout()
        @_timeout(1e9)

      _.defaults options,
        runnableTimeout: prevTimeout
        start: new Date
        interval: 50

      ## we always want to make sure we timeout before our runnable does
      ## so take its current timeout, subtract the total time its already
      ## been running
      options.timeout ?= options.runnableTimeout - (new Date - @prop("runnable").startedAt)

      ## we calculate the total time we've been retrying
      ## so we dont exceed the runnables timeout
      total = (new Date - options.start)

      ## if our total exceeds the timeout OR the total + the interval
      ## exceed the runnables timeout, then bail
      @log "Retrying after: #{options.interval}ms. Total: #{total}, Timeout At: #{options.timeout}, RunnableTimeout: #{options.runnableTimeout}", "warning"

      if total >= options.timeout or (total + options.interval >= options.runnableTimeout)
        @throwErr "Timed out retrying. " + options.error ? "The last command was: " + @prop("current").name

      Promise.delay(options.interval).cancellable().then =>
        @trigger "retry", fn, options

        @log {name: "retry", args: fn}

        ## invoke the passed in retry fn
        fn.call(@)

    _action: (name, args...) ->
      Promise.resolve commands[name].apply(@, args)

    _getSandbox: ->
      sinon = @_window().sinon

      @throwErr("sinon.js was not found in the remote iframe's window.  This may happen if you testing a page you did not directly cy.visit(..).  This happens when you click a regular link.") if not sinon

      @_sandbox ?= sinon.sandbox.create()

    defer: (fn) ->
      @delay(fn, 0)

    delay: (fn, ms) ->
      @clearTimeout(@prop("timerId"))
      @prop "timerId", _.delay(fn, ms)

    _findByNgBinding: (binding, options) ->
      selector = ".ng-binding"

      angular = @_window().angular

      options.error = "Could not find element for binding: '#{binding}'!"

      options.retry = ($elements) ->
        filtered = $elements.filter (index, el) ->
          dataBinding = angular.element(el).data("$binding")

          if dataBinding
            bindingName = dataBinding.exp or dataBinding[0].exp or dataBinding
            return binding in bindingName

        ## if we have items return
        ## those filtered items
        if filtered.length
          return filtered

        ## else return false
        return false

      @_action("find", selector, options)

    _findByNgAttr: (name, attr, el, options) ->
      selectors = []
      error = "Could not find element for #{name}: '#{el}'.  Searched "

      finds = _.map ngPrefixes, (prefix) =>
        selector = "[#{prefix}#{attr}'#{el}']"
        selectors.push(selector)

        @_action("find", selector, options)

      error += selectors.join(", ") + "."

      Promise
        .any(finds)
        .cancellable()
        .catch Promise.CancellationError, (err) =>
          _(finds).invoke("cancel")
          throw err
        .catch Promise.AggregateError, (err) =>
          @throwErr error

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

    $: (selector) ->
      new $.fn.init selector, @_document()

    _: _

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
      @cy.$remoteIframe?.off("submit unload load")
      @cy.isReady(false, "abort")
      @cy.prop("xhr")?.abort()
      @cy.prop("runnable")?.clearTimeout()

      promise = @cy.prop("promise")
      promise?.cancel()

      Promise.resolve(promise).then => @restore()

    ## restores cypress after each test run by
    ## removing the queue from the proto and
    ## removing additional own instance properties
    @restore = ->
      @cy.clearTimeout @cy.prop("runId")
      @cy.clearTimeout @cy.prop("timerId")

      ## reset the queue to an empty array
      Cypress.prototype.queue = []

      ## restore the sandbox if we've
      ## created one
      if sandbox = @cy._sandbox
        sandbox.restore()

        ## if we have a server, resets
        ## these references for GC
        if server = sandbox.server
          server.requests  = []
          server.queue     = []
          server.responses = []

      ## remove any outstanding groups
      ## for any open hooks and runnables
      @cy.group(false)
      @cy.group(false)

      ## remove any event listeners
      @cy.off()
      @cy.stopListening()

      ## removes any registered props from the
      ## instance
      @cy.unregister()

      return @

    ## removes channel, remoteIframe, contentWindow
    ## from the cypress instance
    @stop = ->
      @abort().then =>
        _.extend @cy,
          runner:        null
          remoteIframe:  null
          channel:       null
          config:        null

        window.cy = @cy = null

    ## sets the runnable onto the cy instance
    @set = (runnable, hook) ->
      runnable.startedAt = new Date
      @cy.hook(hook)
      @cy.prop("runnable", runnable)

    ## patches the cypress instance with contentWindow
    ## remoteIframe and channel
    ## this should be moved to an instance method and
    @setup = (runner, $remoteIframe, channel, config) ->
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
        runner:        runner
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

      _.extend @cy, Backbone.Events

      ## return the class as opposed to the
      ## instance so we dont have to worry about
      ## accidentally chaining the 'then' method
      ## during tests
      return @

  return Cypress
