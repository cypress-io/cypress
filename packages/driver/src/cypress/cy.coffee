_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$utils = require("./utils")
$Chai = require("../cy/chai")
$Xhrs = require("../cy/xhrs")
$jQuery = require("../cy/jquery")
$Aliases = require("../cy/aliases")
$Events = require("./events")
$Errors = require("../cy/errors")
$Ensures = require("../cy/ensures")
$Elements = require("../cy/elements")
$Location = require("../cy/location")
$Assertions = require("../cy/assertions")
$Listeners = require("../cy/listeners")
$Chainer = require("./chainer")
$Timeouts = require("../cy/timeouts")
$Retries = require("../cy/retries")
$Stability = require("../cy/stability")
$Snapshots = require("../cy/snapshots")
$Coordinates = require("../cy/coordinates")
$CommandQueue = require("./command_queue")

crossOriginScriptRe = /^script error/i

privateProps = {
  props:    { name: "state", url: true }
  privates: { name: "state", url: false }
}

# window.Cypress ($Cypress)
#
# Cypress.config(...)
#
# Cypress.Server.defaults()
# Cypress.Keyboard.defaults()
# Cypress.Mouse.defaults()
# Cypress.Commands.add("login")
#
# Cypress.on "error"
# Cypress.on "retry"
# Cypress.on "uncaughtException"
#
# cy.on "error"
#
# # Cypress.Log.command()
#
# log = Cypress.log()
#
# log.snapshot().end()
# log.set().get()
#
# cy.log()
#
# cy.foo (Cy)

# { visit, get, find } = cy

getContentWindow = ($autIframe) ->
  $autIframe.prop("contentWindow")

setWindowDocumentProps = (contentWindow, state) ->
  state("window",   contentWindow)
  state("document", contentWindow.document)

setRemoteIframeProps = ($autIframe, state) ->
  state("$autIframe", $autIframe)

create = (specWindow, Cypress, Cookies, state, config, log) ->
  stopped = false
  commandFns = {}

  onFinishAssertions = ->
    assertions.finishAssertions.apply(null, arguments)

  $$ = (selector, context) ->
    context ?= state("document")
    new $.fn.init(selector, context)

  queue = $CommandQueue.create()

  timeouts = $Timeouts.create(state)
  stability = $Stability.create(Cypress, state)
  retries = $Retries.create(Cypress, state, timeouts.timeout, timeouts.clearTimeout, stability.whenStable, onFinishAssertions)
  assertions = $Assertions.create(state, queue, retries.retry)

  elements = $Elements.create(state)
  jquery = $jQuery.create(state)
  location = $Location.create(state)

  { expect } = $Chai.create(specWindow, assertions.assert, elements.isInDom)

  xhrs = $Xhrs.create(state)
  aliases = $Aliases.create(state)
  errors = $Errors.create(state, config, log)
  ensures = $Ensures.create(state, expect, elements.isInDom)

  coordinates = $Coordinates.create(state, ensures.ensureValidPosition)
  snapshots = $Snapshots.create($$, state)

  isCy = (val) ->
    (val is cy) or $utils.isInstanceOf(val, $Chainer)

  runnableCtx = ->
    ensures.ensureRunnable()

    state("runnable").ctx

  urlNavigationEvent = (event) ->
    Cypress.action("app:navigation:changed", "page navigation event (#{event})")

  contentWindowListeners = (contentWindow) ->
    $Listeners.bindTo(contentWindow, {
      onError: ->
        debugger
        ## use a function callback here instead of direct
        ## reference so our users can override this function
        ## if need be
        cy.onUncaughtException.apply(cy, arguments)
      onSubmit: (e) ->
        Cypress.action("app:form:submitted", e)
      onBeforeUnload: (e) ->
        stability.isStable(false, "beforeunload")

        Cookies.setInitial()

        ## we are now isLoading
        # pageLoading(true)

        Cypress.action("app:before:window:unload", e)

        ## return undefined so our beforeunload handler
        ## doesnt trigger a confirmation dialog
        return undefined
      onUnload: (e) ->
        Cypress.action("app:window:unload", e)
      onNavigation: (args...) ->
        Cypress.action("app:navigation:changed", args...)
      onAlert: (str) ->
      onConfirm: (str) ->
    })

  enqueue = (obj) ->
    ## if we have a nestedIndex it means we're processing
    ## nested commands and need to splice them into the
    ## index past the current index as opposed to
    ## pushing them to the end we also dont want to
    ## reset the run defer because splicing means we're
    ## already in a run loop and dont want to create another!
    ## we also reset the .next property to properly reference
    ## our new obj

    ## we had a bug that would bomb on custom commands when it was the
    ## first command. this was due to nestedIndex being undefined at that
    ## time. so we have to ensure to check that its any kind of number (even 0)
    ## in order to know to splice into the existing array.
    nestedIndex = state("nestedIndex")

    ## if this is a number then we know
    ## we're about to splice this into our commands
    ## and need to reset next + increment the index
    if _.isNumber(nestedIndex)
      state("nestedIndex", nestedIndex += 1)

    ## we look at whether or not nestedIndex is a number, because if it
    ## is then we need to splice inside of our commands, else just push
    ## it onto the end of the queu
    index = if _.isNumber(nestedIndex) then nestedIndex else queue.length

    queue.splice(index, 0, obj)

    Cypress.action("cy:command:enqueued", obj)

  getCommandsUntilFirstParentOrValidSubject = (command, memo = []) ->
    return null if not command

    ## push these onto the beginning of the commands array
    memo.unshift(command)

    ## break and return the memo
    if command.get("type") is "parent" or cy.isInDom(command.get("subject"))
      return memo

    getCommandsUntilFirstParentOrValidSubject(command.get("prev"), memo)

  doneEarly = ->
    p = state("promise")

    ## make sure we cancel our outstanding
    ## promise since we could have ended early
    ## with commands still retrying or in the queue
    if p and p.isPending()
      state("canceled", true)
      p.cancel()

    cleanup()

  removeSubject = ->
    state("subject", undefined)

  cleanup = ->
    ## cleanup could be called during a 'stop' event which
    ## could happen in between a runnable because they are async
    if state("runnable")
      ## make sure we don't ever time out this runnable now
      timeouts.clearTimeout()

    ## reset the nestedIndex back to null
    state("nestedIndex", null)

    ## also reset recentlyReady back to null
    state("recentlyReady", null)

    ## and forcibly move the index needle to the
    ## end in case we have after / afterEach hooks
    ## which need to run
    state("index", queue.length)

  fail = (err, runnable) ->
    cleanup()

    ## store the error on state now
    state("error", err)

    Cypress.action("cy:fail", err, state("runnable"))

    throw err

  cy = {
    id: _.uniqueId("cy")

    ## synchrounous querying
    $$

    state

    ## command queue instance
    queue

    ## errors sync methods
    fail

    ## chai expect sync methods
    expect

    ## is cy
    isCy

    ## has element in dom sync
    isInDom: elements.isInDom

    ## timeout sync methods
    timeout: timeouts.timeout
    clearTimeout: timeouts.clearTimeout

    ## stability sync methods
    isStable: stability.isStable
    whenStable: stability.whenStable

    ## xhr sync methods
    getRequestsByAlias: xhrs.getRequestsByAlias
    getIndexedXhrByAlias: xhrs.getIndexedXhrByAlias

    ## alias sync methods
    getAlias: aliases.getAlias
    addAlias: aliases.addAlias
    validateAlias: aliases.validateAlias
    getNextAlias: aliases.getNextAlias
    aliasNotFoundFor: aliases.aliasNotFoundFor
    getXhrTypeByAlias: aliases.getXhrTypeByAlias

    ## location sync methods
    getRemoteLocation: location.getRemoteLocation

    ## jquery sync methods
    getRemotejQueryInstance: jquery.getRemotejQueryInstance

    ## snapshots sync methods
    createSnapshot: snapshots.createSnapshot

    ## retry sync methods
    retry: retries.retry

    ## coordinates sync methods
    getAbsoluteCoordinates: coordinates.getAbsoluteCoordinates
    getElementAtCoordinates: coordinates.getElementAtCoordinates
    getAbsoluteCoordinatesRelativeToXY: coordinates.getAbsoluteCoordinatesRelativeToXY

    ## assertions sync methods
    assert: assertions.assert
    verifyUpcomingAssertions: assertions.verifyUpcomingAssertions

    ## ensure sync methods
    ensureSubject: ensures.ensureSubject
    ensureParent: ensures.ensureParent
    ensureDom: ensures.ensureDom
    ensureExistence: ensures.ensureExistence
    ensureElExistence: ensures.ensureElExistence
    ensureVisibility: ensures.ensureVisibility
    ensureDescendents: ensures.ensureDescendents
    ensureReceivability: ensures.ensureReceivability
    ensureValidPosition: ensures.ensureValidPosition
    ensureScrollability: ensures.ensureScrollability
    ensureElementIsNotAnimating: ensures.ensureElementIsNotAnimating

    initialize: ($autIframe) ->
      setRemoteIframeProps($autIframe, state)

      ## dont need to worry about a try/catch here
      ## because this is during initialize and its
      ## impossible something is wrong here
      setWindowDocumentProps(getContentWindow($autIframe), state)

      ## initially set the content window listeners too
      ## so we can tap into all the normal flow of events
      ## like before:unload, navigation events, etc
      contentWindowListeners(getContentWindow($autIframe))

      ## the load event comes from the autIframe anytime any window
      ## inside of it loads.
      ## when this happens we need to check for cross origin errors
      ## by trying to talk to the contentWindow document to see if
      ## its accessible.
      ## when we find ourselves in a cross origin situation, then our
      ## proxy has not injected Cypress.action('before:window:load')
      ## so Cypress.onBeforeAppWindowLoad() was never called
      $autIframe.on "load", =>
        ## if setting these props failed
        ## then we know we're in a cross origin failure
        try
          setWindowDocumentProps(getContentWindow($autIframe), state)

          ## we may need to update the url now
          urlNavigationEvent("load")

          ## we normally DONT need to reapply contentWindow listeners
          ## because they would have been automatically applied during
          ## onBeforeAppWindowLoad, but in the case where we visited
          ## about:blank in a visit, we do need these
          contentWindowListeners(getContentWindow($autIframe))

          ## we are done isLoading
          # pageLoading(false)

          Cypress.action("app:window:load", state("window"))

          ## we are now stable again which is purposefully
          ## the last event we call here, to give our event
          ## listeners time to be invoked prior to moving on
          stability.isStable(true, "load")
        catch err
          ## catch errors associated to cross origin iframes
          if ready = state("ready")
            ready.reject(err)
          else
            fail(err, state("runnable"))

    stop: ->
      ## don't do anything if we've already stopped
      if stopped
        return

      stopped = true

      doneEarly()

    reset: ->
      stopped = false

      s = state()

      backup = {
        window: s.window
        document: s.document
        $autIframe: s.$autIframe
      }

      ## reset state back to empty object
      state.reset()

      ## and then restore these backed up props
      state(backup)

      queue.reset()

      cy.removeAllListeners()

    addCommandSync: (name, fn) ->
      cy[name] = ->
        fn.apply(runnableCtx(), arguments)

    addChainer: (name, fn) ->
      ## add this function to our chainer class
      $Chainer.add(name, fn)

    addCommand: ({name, fn, type, enforceDom}) ->
      ## TODO: prob don't need this anymore
      commandFns[name] = fn

      prepareSubject = (firstCall, args) =>
        ## if this is the very first call
        ## on the chainer then make the first
        ## argument undefined (we have no subject)
        if firstCall
          removeSubject()

        subject = state("subject")

        if enforceDom
          cy.ensureDom(subject, name)

        args.unshift(subject)

        ## TODO: handle this event
        Cypress.action("cy:next:subject:prepared", subject, args)

        args

      wrap = (firstCall) =>
        fn = commandFns[name]
        wrapped = wrapByType(fn, firstCall)
        wrapped.originalFn = fn
        wrapped

      wrapByType = (fn, firstCall) ->
        switch type
          when "parent"
            return fn

          when "dual", "utility"
            _.wrap fn, (orig, args...) ->
              ## push the subject into the args
              args = prepareSubject(firstCall, args)

              return orig.apply(@, args)

          when "child", "assertion"
            _.wrap fn, (orig, args...) ->
              if firstCall
                $utils.throwErrByPath("miscellaneous.invoking_child_without_parent", {
                  args: {
                    cmd:  name
                    args: $utils.stringify(args)
                  }
                })

              ## push the subject into the args
              args = prepareSubject(firstCall, args)

              subject = args[0]

              ret = orig.apply(@, args)

              return ret ? subject

      cy[name] = (args...) ->
        ensures.ensureRunnable()

        ## this is the first call on cypress
        ## so create a new chainer instance
        chain = $Chainer.create(name, args)

        ## store the chain so we can access it later
        state("chain", chain)

        return chain

      cy.addChainer name, (chainer, args) ->
        { firstCall, chainerId } = chainer

        ## dont enqueue / inject any new commands if
        ## onInjectCommand returns false
        onInjectCommand = state("onInjectCommand")

        if _.isFunction(onInjectCommand)
          return if onInjectCommand.call(cy, name, args...) is false

        enqueue({
          name
          args
          type
          chainerId
          fn: wrap(firstCall)
        })

        return true

    now: (name, args...) ->
      Promise.resolve(
        commandFns[name].apply(cy, args)
      )

    replayCommandsFrom: (current) ->
      ## reset each chainerId to the
      ## current value
      chainerId = state("chainerId")

      insert = (command) ->
        command.set("chainerId", chainerId)

        ## clone the command to prevent
        ## mutating its properties
        enqueue(command.clone())

      ## - starting with the aliased command
      ## - walk up to each prev command
      ## - until you reach a parent command
      ## - or until the subject is in the DOM
      ## - from that command walk down inserting
      ##   every command which changed the subject
      ## - coming upon an assertion should only be
      ##   inserted if the previous command should
      ##   be replayed

      commands = getCommandsUntilFirstParentOrValidSubject(current)

      if commands
        initialCommand = commands.shift()

        commandsToInsert = _.reduce(commands, (memo, command, index) ->
          push = ->
            memo.push(command)

          switch
            when command.get("type") is "assertion"
              ## if we're an assertion and the prev command
              ## is in the memo, then push this one
              if command.get("prev") in memo
                push()

            when command.get("subject") isnt initialCommand.get("subject")
              ## when our subjects dont match then
              ## reset the initialCommand to this command
              ## so the next commands can compare against
              ## this one to figure out the changing subjects
              initialCommand = command

              push()

          return memo

        , [initialCommand])

        for c in commandsToInsert
          insert(c)

      ## prevent loop comprehension
      return null

    onBeforeAppWindowLoad: (contentWindow) ->
      # @cy.silenceConsole(contentWindow) if Cypress.isHeadless

      ## we set window / document props before the window load event
      ## so that we properly handle events coming from the application
      ## from the time that happens BEFORE the load event occurs
      setWindowDocumentProps(contentWindow, state)

      urlNavigationEvent("before:load")

      contentWindowListeners(contentWindow)

    onUncaughtException: ->
      runnable = state("runnable")

      ## create the special uncaught exception err
      err = errors.createUncaughtException.apply(null, arguments)

      ## do all the normal fail stuff and promise cancellation
      ## but dont re-throw the error
      try
        fail(err)
      catch err
        ## pass this to our runnable so it
        ## fails nicely
        ##
        ## this is the same as passing done(err)
        ## in the runnable.fn
        runnable.callback(err)

      ## per the onerror docs we need to return true here
      ## https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
      ## When the function returns true, this prevents the firing of the default event handler.
      return true

    getStyles: ->
      snapshots.getStyles()

    checkForEndedEarly: ->
      ## if our index is above 0 but is below the commands.length
      ## then we know we've ended early due to a done() and
      ## we should throw a very specific error message
      index = state("index")
      if index > 0 and index < queue.length
        errors.endedEarlyErr(index, queue)

    setRunnable: (runnable, hookName) ->
      state("hookName", hookName)

      state("runnable", runnable)

      state("ctx", runnable.ctx)

      fn = runnable.fn

      restore = ->
        runnable.fn = fn

      runnable.fn = ->
        restore()

        timeout = config("defaultCommandTimeout")

        ## control timeouts on runnables ourselves
        if _.isFinite(timeout)
          timeouts.timeout(timeout)

        ## store the current length of our queue
        ## before we invoke the runnable.fn
        currentLength = queue.length

        try
          ## if we have a fn.length that means we
          ## are accepting a done callback and need
          ## to change the semantics around how we
          ## attach the run queue
          if fn.length
            originalDone = arguments[0]

            arguments[0] = done = (err) ->
              ## TODO: handle no longer error
              ## when ended early
              doneEarly()

              originalDone(err)

          ret = fn.apply(@, arguments)

          ## if we attached a done callback
          ## and returned a promise then we
          ## need to automatically bind to
          ## .catch() and return done(err)
          ## TODO: this has gone away in mocha 3.x.x
          ## due to overspecifying a resolution.
          ## in those cases we need to remove
          ## returning a promise
          if fn.length and ret and ret.catch
            ret = ret.catch(done)

          ## if we returned a value from fn
          ## and enqueued some new commands
          ## and the value isnt currently cy
          if ret and (queue.length > currentLength) and (not isCy(ret))
            debugger

          ## if we didn't fire up any cy commands
          ## then send back mocha what was returned
          if queue.length is currentLength
            return ret

          ## kick off the run!
          ## and return this outer
          ## bluebird promise
          return cy.run()

        catch err
          ## if our runnable.fn throw synchronously
          ## then it didnt fail from a cypress command
          ## but we should still teardown and handle
          ## the error
          fail(err, runnable)

    run: ->
      next = ->
        ## bail if we've been told to abort in case
        ## an old command continues to run after
        if stopped
          return

        ## start at 0 index if we dont have one
        index = state("index") ? state("index", 0)

        command = queue.at(index)

        ## if the command should be skipped
        ## just bail and increment index
        ## and set the subject
        ## TODO DRY THIS LOGIC UP
        if command and command.get("skip")
          ## must set prev + next since other
          ## operations depend on this state being correct
          command.set({prev: queue.at(index - 1), next: queue.at(index + 1)})
          state("index", index + 1)
          state("subject", command.get("subject"))

          return next()

        ## if we're at the very end
        if not command

          ## trigger queue is almost finished
          Cypress.action("cy:command:queue:before:end")

          ## we need to wait after all commands have
          ## finished running if the application under
          ## test is no longer stable because we cannot
          ## move onto the next test until its finished
          return stability.whenStable ->
            Cypress.action("cy:command:queue:end")

            return null

        ## store the previous timeout
        prevTimeout = timeouts.timeout()

        ## store the current runnable
        runnable = state("runnable")

        Cypress.action("cy:command:start", command)

        cy
        .set(command)
        .then =>
          ## each successful command invocation should
          ## always reset the timeout for the current runnable
          ## unless it already has a state.  if it has a state
          ## and we reset the timeout again, it will always
          ## cause a timeout later no matter what.  by this time
          ## mocha expects the test to be done
          timeouts.timeout(prevTimeout) if not runnable.state

          ## mutate index by incrementing it
          ## this allows us to keep the proper index
          ## in between different hooks like before + beforeEach
          ## else run will be called again and index would start
          ## over at 0
          state("index", index += 1)

          Cypress.action("cy:command:end", command)

          if fn = state("onPaused")
            new Promise (resolve) ->
              fn(resolve)
            .then(next)
          else
            next()

      promise = Promise
      .try(next)
      .catch (err) ->
        ## since this failed this means that a
        ## specific command failed and we should
        ## highlight it in red or insert a new command
        errors.commandRunningFailed(err)

        fail(err, state("runnable"))

      .finally(cleanup)

      ## signify we are at the end of the chain and do not
      ## continue chaining anymore
      # promise.done()

      state("promise", promise)

      ## return this outer bluebird promise
      return promise

      ## TODO: handle this event
      # @trigger("set", command)

    set: (command) ->
      state("current", command)
      state("chainerId", command.get("chainerId"))

      stability.whenStable ->
        ## TODO: handle this event
        # @trigger "invoke:start", command

        state "nestedIndex", state("index")

        command.get("args")

      ## allow promises to be used in the arguments
      ## and wait until they're all resolved
      .all()

      .then (args) =>
        ## if the first argument is a function and it has an _invokeImmediately
        ## property that means we are supposed to immediately invoke
        ## it and use its return value as the argument to our
        ## current command object
        if _.isFunction(args[0]) and args[0]._invokeImmediately
          args[0] = args[0].call(@)

        ## run the command's fn with runnable's context
        ret = command.get("fn").apply(state("ctx"), args)

        ## allow us to immediately tap into
        ## return value of our command
        ## TODO: handle this event
        # @trigger "command:returned:value", command, ret

        ## we cannot pass our cypress instance or our chainer
        ## back into bluebird else it will create a thenable
        ## which is never resolved
        if isCy(ret) then null else ret

      .then (subject) =>
        ## if ret is a DOM element and its not an instance of our own jQuery
        if subject and $utils.hasElement(subject) and not $utils.isInstanceOf(subject, $)
          ## set it back to our own jquery object
          ## to prevent it from being passed downstream
          subject = $(subject)

        command.set({ subject: subject })

        ## end / snapshot our logs
        ## if they need it
        command.finishLogs()

        ## trigger an event here so we know our
        ## command has been successfully applied
        ## and we've potentially altered the subject
        ## TODO: handle this event
        # @trigger "invoke:subject", subject, command

        ## reset the nestedIndex back to null
        state("nestedIndex", null)

        ## also reset recentlyReady back to null
        state("recentlyReady", null)

        state("subject", subject)

        return subject
  }

  _.each privateProps, (obj, key) =>
    Object.defineProperty(cy, key, {
      get: ->
        $utils.throwErrByPath("miscellaneous.private_property", {
          args: obj
        })
    })

  ## make cy global in the specWindow
  specWindow.cy = cy

  $Events.extend(cy)

  return cy

module.exports = {
  create
}
