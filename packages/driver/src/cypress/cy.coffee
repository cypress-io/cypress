_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$dom = require("../dom")
$utils = require("./utils")
$Chai = require("../cy/chai")
$Xhrs = require("../cy/xhrs")
$jQuery = require("../cy/jquery")
$Aliases = require("../cy/aliases")
$Events = require("./events")
$Errors = require("../cy/errors")
$Ensures = require("../cy/ensures")
$Location = require("../cy/location")
$Assertions = require("../cy/assertions")
$Listeners = require("../cy/listeners")
$Chainer = require("./chainer")
$Timeouts = require("../cy/timeouts")
$Retries = require("../cy/retries")
$Stability = require("../cy/stability")
$Snapshots = require("../cy/snapshots")
$CommandQueue = require("./command_queue")

crossOriginScriptRe = /^script error/i

privateProps = {
  props:    { name: "state", url: true }
  privates: { name: "state", url: false }
}

noArgsAreAFunction = (args) ->
  not _.some(args, _.isFunction)

isPromiseLike = (ret) ->
  ret and _.isFunction(ret.then)

returnedFalse = (result) ->
  result is false

silenceConsole = (contentWindow) ->
  if c = contentWindow.console
    c.log = ->
    c.warn = ->
    c.info = ->

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

  isStopped = -> stopped

  onFinishAssertions = ->
    assertions.finishAssertions.apply(null, arguments)

  warnMixingPromisesAndCommands = ->
    title = state("runnable").fullTitle()

    msg = $utils.errMessageByPath("miscellaneous.mixing_promises_and_commands", title)

    $utils.warning(msg)

  $$ = (selector, context) ->
    context ?= state("document")
    new $.fn.init(selector, context)

  queue = $CommandQueue.create()

  timeouts = $Timeouts.create(state)
  stability = $Stability.create(Cypress, state)
  retries = $Retries.create(Cypress, state, timeouts.timeout, timeouts.clearTimeout, stability.whenStable, onFinishAssertions)
  assertions = $Assertions.create(state, queue, retries.retry)

  jquery = $jQuery.create(state)
  location = $Location.create(state)

  { expect } = $Chai.create(specWindow, assertions.assert)

  xhrs = $Xhrs.create(state)
  aliases = $Aliases.create(state)

  errors = $Errors.create(state, config, log)
  ensures = $Ensures.create(state, expect)

  snapshots = $Snapshots.create($$, state)

  isCy = (val) ->
    (val is cy) or $utils.isInstanceOf(val, $Chainer)

  runnableCtx = (name) ->
    ensures.ensureRunnable(name)

    state("runnable").ctx

  urlNavigationEvent = (event) ->
    Cypress.action("app:navigation:changed", "page navigation event (#{event})")

  contentWindowListeners = (contentWindow) ->
    $Listeners.bindTo(contentWindow, {
      onError: ->
        ## use a function callback here instead of direct
        ## reference so our users can override this function
        ## if need be
        cy.onUncaughtException.apply(cy, arguments)
      onSubmit: (e) ->
        Cypress.action("app:form:submitted", e)
      onBeforeUnload: (e) ->
        stability.isStable(false, "beforeunload")

        Cookies.setInitial()

        Cypress.action("app:window:before:unload", e)

        ## return undefined so our beforeunload handler
        ## doesnt trigger a confirmation dialog
        return undefined
      onUnload: (e) ->
        Cypress.action("app:window:unload", e)
      onNavigation: (args...) ->
        Cypress.action("app:navigation:changed", args...)
      onAlert: (str) ->
        Cypress.action("app:window:alert", str)
      onConfirm: (str) ->
        results = Cypress.action("app:window:confirm", str)

        ## return false if ANY results are false
        ## else true
        ret = !_.some(results, returnedFalse)

        Cypress.action("app:window:confirmed", str, ret)

        return ret
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
    if command.get("type") is "parent" or $dom.isAttached(command.get("subject"))
      return memo

    getCommandsUntilFirstParentOrValidSubject(command.get("prev"), memo)

  runCommand = (command) ->
    ## bail here prior to creating a new promise
    ## because we could have stopped / canceled
    ## prior to ever making it through our first
    ## command
    return if stopped

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

    .then (args) ->
      ## store this if we enqueue new commands
      ## to check for promise violations
      enqueuedCmd = null

      commandEnqueued = (obj) ->
        enqueuedCmd = obj

      ## only check for command enqueing when none
      ## of our args are functions else commands
      ## like cy.then or cy.each would always fail
      ## since they return promises and queue more
      ## new commands
      if noArgsAreAFunction(args)
        Cypress.once("command:enqueued", commandEnqueued)

      ## run the command's fn with runnable's context
      try
        ret = command.get("fn").apply(state("ctx"), args)
      catch err
        throw err
      finally
        ## always remove this listener
        Cypress.removeListener("command:enqueued", commandEnqueued)

      state("commandIntermediateValue", ret)

      ## we cannot pass our cypress instance or our chainer
      ## back into bluebird else it will create a thenable
      ## which is never resolved
      switch
        when isCy(ret)
          null
        when enqueuedCmd and isPromiseLike(ret)
          $utils.throwErrByPath(
            "miscellaneous.command_returned_promise_and_commands", {
              args: {
                current: command.get("name")
                called: enqueuedCmd.name
              }
            }
          )
        when enqueuedCmd and not _.isUndefined(ret)
          ## TODO: clean this up in the utility function
          ## to conditionally stringify functions
          ret = if _.isFunction(ret)
            ret.toString()
          else
            $utils.stringify(ret)

          ## if we got a return value and we enqueued
          ## a new command and we didn't return cy
          ## or an undefined value then throw
          $utils.throwErrByPath(
            "miscellaneous.returned_value_and_commands_from_custom_command", {
              args: {
                current: command.get("name")
                returned: ret
              }
            }
          )
        else
          ret
    .then (subject) ->
      state("commandIntermediateValue", undefined)

      ## if ret is a DOM element and its not an instance of our own jQuery
      if subject and $dom.isElement(subject) and not $utils.isInstanceOf(subject, $)
        ## set it back to our own jquery object
        ## to prevent it from being passed downstream
        ## TODO: enable turning this off
        ## wrapSubjectsInJquery: false
        ## which will just pass subjects downstream
        ## without modifying them
        subject = $(subject)

      command.set({ subject: subject })

      ## end / snapshot our logs
      ## if they need it
      command.finishLogs()

      ## reset the nestedIndex back to null
      state("nestedIndex", null)

      ## also reset recentlyReady back to null
      state("recentlyReady", null)

      state("subject", subject)

      return subject

  run = ->
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

      runCommand(command)
      .then ->
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

    inner = null

    ## this ends up being the parent promise wrapper
    promise = new Promise((resolve, reject) ->
      ## bubble out the inner promise
      ## we must use a resolve(null) here
      ## so the outer promise is first defined
      ## else this will kick off the 'next' call
      ## too soon and end up running commands prior
      ## to promise being defined
      inner = Promise
      .resolve(null)
      .then(next)
      .then(resolve)
      .catch(reject)

      ## can't use onCancel argument here because
      ## its called asynchronously

      ## when we manually reject our outer promise we
      ## have to immediately cancel the inner one else
      ## it won't be notified and its callbacks will
      ## continue to be invoked
      ## normally we don't have to do this because rejections
      ## come from the inner promise and bubble out to our outer
      ##
      ## but when we manually reject the outer promise we
      ## have to go in the opposite direction from outer -> inner
      rejectOuterAndCancelInner = (err) ->
        inner.cancel()
        reject(err)

      state("resolve", resolve)
      state("reject", rejectOuterAndCancelInner)
    )
    .catch((err) ->
      ## since this failed this means that a
      ## specific command failed and we should
      ## highlight it in red or insert a new command
      errors.commandRunningFailed(err)

      fail(err, state("runnable"))
    )
    .finally(cleanup)

    ## cancel both promises
    cancel = ->
      promise.cancel()
      inner.cancel()

      ## notify the world
      Cypress.action("cy:canceled")

    state("cancel", cancel)
    state("promise", promise)

    ## return this outer bluebird promise
    return promise

  removeSubject = ->
    state("subject", undefined)

  pushSubjectAndValidate = (name, args, firstCall, prevSubject) ->
    if firstCall
      ## if we have a prevSubject then error
      ## since we're invoking this improperly
      if prevSubject and ("optional" not in [].concat(prevSubject))
        $utils.throwErrByPath("miscellaneous.invoking_child_without_parent", {
          args: {
            cmd:  name
            args: $utils.stringifyActual(args[0])
          }
        })

      ## else if this is the very first call
      ## on the chainer then make the first
      ## argument undefined (we have no subject)
      removeSubject()

    subject = state("subject")

    if prevSubject
      ## make sure our current subject is valid for
      ## what we expect in this command
      ensures.ensureSubjectByType(subject, prevSubject, name)

    args.unshift(subject)

    Cypress.action("cy:next:subject:prepared", subject, args)

    args

  doneEarly = ->
    stopped = true

    ## we only need to worry about doneEarly when
    ## it comes from a manual event such as stopping
    ## Cypress or when we yield a (done) callback
    ## and could arbitrarily call it whenever we want
    p = state("promise")

    ## if our outer promise is pending
    ## then cancel outer and inner
    ## and set canceled to be true
    if (p and p.isPending())
      state("canceled", true)
      state("cancel")()

    cleanup()

  cleanup = ->
    ## cleanup could be called during a 'stop' event which
    ## could happen in between a runnable because they are async
    if state("runnable")
      ## make sure we don't ever time out this runnable now
      timeouts.clearTimeout()

    ## if a command fails then after each commands
    ## could also fail unless we clear this out
    state("commandIntermediateValue", undefined)

    ## reset the nestedIndex back to null
    state("nestedIndex", null)

    ## also reset recentlyReady back to null
    state("recentlyReady", null)

    ## and forcibly move the index needle to the
    ## end in case we have after / afterEach hooks
    ## which need to run
    state("index", queue.length)

  fail = (err, runnable) ->
    stopped = true

    ## store the error on state now
    state("error", err)

    finish = (err) ->
      ## if we have an async done callback
      ## we have an explicit (done) callback and
      ## we aren't attached to the cypress command queue
      ## promise chain and throwing the error would only
      ## result in an unhandled rejection
      if d = state("done")
        ## invoke it with err
        return d(err)

      ## else we're connected to the promise chain
      ## and need to throw so this bubbles up
      throw err

    ## if we have a "fail" handler
    ## 1. catch any errors it throws and fail the test
    ## 2. otherwise swallow any errors
    ## 3. but if the test is not ended with a done()
    ##    then it should fail
    ## 4. and tests without a done will pass

    ## if we dont have a "fail" handler
    ## 1. callback with state("done") when async
    ## 2. throw the error for the promise chain
    try
      ## collect all of the callbacks for 'fail'
      rets = Cypress.action("cy:fail", err, state("runnable"))
    catch err2
      ## and if any of these throw synchronously immediately error
      finish(err2)

    ## bail if we had callbacks attached
    return if rets.length

    ## else figure out how to finisht this failure
    return finish(err)

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

    isStopped

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

    ## assertions sync methods
    assert: assertions.assert
    verifyUpcomingAssertions: assertions.verifyUpcomingAssertions

    ## ensure sync methods
    ensureWindow: ensures.ensureWindow
    ensureElement: ensures.ensureElement
    ensureDocument: ensures.ensureDocument
    ensureAttached: ensures.ensureAttached
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
      ## proxy has not injected Cypress.action('window:before:load')
      ## so Cypress.onBeforeAppWindowLoad() was never called
      $autIframe.on "load", ->
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

          Cypress.action("app:window:load", state("window"))

          ## we are now stable again which is purposefully
          ## the last event we call here, to give our event
          ## listeners time to be invoked prior to moving on
          stability.isStable(true, "load")
        catch err
          ## we failed setting the remote window props
          ## which means we're in a cross domain failure
          ## check first to see if you have a callback function
          ## defined and let the page load change the error
          if onpl = state("onPageLoadErr")
            err = onpl(err)

          ## and now reject with it
          if r = state("reject")
            r(err)

    stop: ->
      ## don't do anything if we've already stopped
      if stopped
        return

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
        fn.apply(runnableCtx(name), arguments)

    addChainer: (name, fn) ->
      ## add this function to our chainer class
      $Chainer.add(name, fn)

    addCommand: ({name, fn, type, prevSubject}) ->
      ## TODO: prob don't need this anymore
      commandFns[name] = fn

      wrap = (firstCall) ->
        fn = commandFns[name]
        wrapped = wrapByType(fn, firstCall)
        wrapped.originalFn = fn
        wrapped

      wrapByType = (fn, firstCall) ->
        if type is "parent"
          return fn

        ## child, dual, assertion, utility command
        ## pushes the previous subject into them
        ## after verifying its of the correct type
        return (args...) ->
          ## push the subject into the args
          args = pushSubjectAndValidate(name, args, firstCall, prevSubject)

          fn.apply(runnableCtx(name), args)

      cy[name] = (args...) ->
        ensures.ensureRunnable(name)

        ## this is the first call on cypress
        ## so create a new chainer instance
        chain = $Chainer.create(name, args)

        ## store the chain so we can access it later
        state("chain", chain)

        ## if we are in the middle of a command
        ## and its return value is a promise
        ## that means we are attempting to invoke
        ## a cypress command within another cypress
        ## command and we should error
        if ret = state("commandIntermediateValue")
          current = state("current")

          ## if this is a custom promise
          if isPromiseLike(ret) and noArgsAreAFunction(current.get("args"))
            $utils.throwErrByPath(
              "miscellaneous.command_returned_promise_and_commands", {
                args: {
                  current: current.get("name")
                  called: name
                }
              }
            )

        ## if we're the first call onto a cy
        ## command, then kick off the run
        if not state("promise")
          if state("returnedCustomPromise")
            warnMixingPromisesAndCommands()

          run()

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
      ## we silence the console when running headlessly
      ## because console logs are kept around in memory for
      ## inspection via the developer
      if not config("isInteractive")
        silenceConsole(contentWindow)

      ## we set window / document props before the window load event
      ## so that we properly handle events coming from the application
      ## from the time that happens BEFORE the load event occurs
      setWindowDocumentProps(contentWindow, state)

      urlNavigationEvent("before:load")

      contentWindowListeners(contentWindow)

    onSpecWindowUncaughtException: ->
      ## create the special uncaught exception err
      err = errors.createUncaughtException("spec", arguments)

      if runnable = state("runnable")
        ## we're using an explicit done callback here
        if d = state("done")
          d(err)

        if r = state("reject")
          return r(err)

      ## else pass the error along
      return err

    onUncaughtException: ->
      runnable = state("runnable")

      ## don't do anything if we don't have a current runnable
      return if not runnable

      ## create the special uncaught exception err
      err = errors.createUncaughtException("app", arguments)

      results = Cypress.action("app:uncaught:exception", err, runnable)

      ## dont do anything if any of our uncaught:exception
      ## listeners returned false
      return if _.some(results, returnedFalse)

      ## do all the normal fail stuff and promise cancellation
      ## but dont re-throw the error
      if r = state("reject")
        r(err)

      ## per the onerror docs we need to return true here
      ## https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
      ## When the function returns true, this prevents the firing of the default event handler.
      return true

    getStyles: ->
      snapshots.getStyles()

    setRunnable: (runnable, hookName) ->
      ## when we're setting a new runnable
      ## prepare to run again!
      stopped = false

      ## reset the promise again
      state("promise", undefined)

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

              ## return null else we there are situations
              ## where returning a regular bluebird promise
              ## results in a warning about promise being created
              ## in a handler but not returned
              return null

            ## store this done property
            ## for async tests
            state("done", done)

          ret = fn.apply(@, arguments)

          ## if we returned a value from fn
          ## and enqueued some new commands
          ## and the value isnt currently cy
          ## or a promise
          if ret and
            (queue.length > currentLength) and
              (not isCy(ret)) and
                (not isPromiseLike(ret))

            ## TODO: clean this up in the utility function
            ## to conditionally stringify functions
            ret = if _.isFunction(ret)
              ret.toString()
            else
              $utils.stringify(ret)

            $utils.throwErrByPath("miscellaneous.returned_value_and_commands", {
              args: ret
            })

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

          ## if we returned a promise like object
          if (not isCy(ret)) and isPromiseLike(ret)
            ## indicate we've returned a custom promise
            state("returnedCustomPromise", true)

            ## this means we instantiated a promise
            ## and we've already invoked multiple
            ## commands and should warn
            if queue.length > currentLength
              warnMixingPromisesAndCommands()

            return ret

          ## if we're cy or we've enqueued commands
          if isCy(ret) or (queue.length > currentLength)
            ## the run should already be kicked off
            ## by now and return this promise
            return state("promise")

          ## else just return ret
          return ret

        catch err
          ## if our runnable.fn throw synchronously
          ## then it didnt fail from a cypress command
          ## but we should still teardown and handle
          ## the error
          fail(err, runnable)

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
