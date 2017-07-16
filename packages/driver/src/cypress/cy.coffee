_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$utils = require("./utils")
$Chai = require("../cy/chai")
$Xhrs = require("../cy/xhrs")
$Agents = require("../cy/agents")
$Aliases = require("../cy/aliases")
$Errors = require("../cy/errors")
$Ensures = require("../cy/ensures")
$Elements = require("../cy/elements")
$Assertions = require("../cy/assertions")
$Listeners = require("../cy/listeners")
$Chainer = require("./chainer")
$Timeouts = require("../cy/timeouts")
$Retries = require("../cy/retries")
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

create = (specWindow, Cypress, state, config, log) ->
  aborted = false

  onFinishAssertions = ->
    assertions.finishAssertions.apply(null, arguments)

  $$ = (selector, context) ->
    context ?= state("document")
    new $.fn.init(selector, context)

  queue = $CommandQueue.create()

  retries = $Retries.create(state, onFinishAssertions)
  assertions = $Assertions.create(state, queue, retries.retry)

  elements = $Elements.create(state)

  { expect } = $Chai.create(specWindow, assertions.assert, elements.isInDom)

  xhrs = $Xhrs.create(state)
  agents = $Agents.create()
  aliases = $Aliases.create(state)
  errors = $Errors.create(state, config, log)
  ensures = $Ensures.create(state, config, expect, elements.isInDom)
  timeouts = $Timeouts.create(state)

  coordinates = $Coordinates.create(state, ensures.ensureValidPosition)
  snapshots = $Snapshots.create($$, state)

  commandFns = {}

  isCy = (val) ->
    (val is cy) or $utils.isInstanceOf(val, $Chainer)

  defer = (fn) ->
    clearImmediate(state("timerId"))

    ## do not queue up any new commands if
    ## we've already been aborted!
    ## TODO: handle this property
    return if aborted

    state("timerId", setImmediate(fn))

  fail = (err) ->
    errors.fail(err)

    ## reset the nestedIndex back to null
    state("nestedIndex", null)

    ## also reset recentlyReady back to null
    state("recentlyReady", null)

    ## and forcibly move the index needle to the
    ## end in case we have after / afterEach hooks
    ## which need to run
    state("index", queue.length)

    Cypress.action("cy:fail", err, state("runnable"))

    return err

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

    ## agent sync methods
    spy: agents.spy
    stub: agents.stub
    agents: agents.agents

    ## has element in dom sync
    isInDom: elements.isInDom

    ## timeout sync methods
    timeout: timeouts.timeout
    clearTimeout: timeouts.clearTimeout

    ## xhr sync methods
    getLastXhrByAlias: xhrs.getLastXhrByAlias
    getRequestsByAlias: xhrs.getRequestsByAlias

    ## alias sync methods
    getAlias: aliases.getAlias

    ## snapshots sync methods
    createSnapshot: snapshots.createSnapshot

    ## retry sync methods
    retry: retries.retry

    ## coordinates sync methods
    getCoordinates: coordinates.getCoordinates
    getElementAtCoordinates: coordinates.getElementAtCoordinates

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

    initialize: ($autIframe) ->
      setRemoteIframeProps($autIframe, state)

      ## dont need to worry about a try/catch here
      ## because this is during initialize and its
      ## impossible something is wrong here
      setWindowDocumentProps(getContentWindow($autIframe), state)

      ## the load event comes from the autIframe anytime any window
      ## inside of it loads.
      ## when this happens we need to check from cross origin errors
      ## by trying to talk to the contentWindow document to see if
      ## its accessible.
      ## when we find ourselves in a cross origin situation, then our
      ## proxy has not injected Cypress.action('aut:before:window:load')
      ## so Cypress.onBeforeAutWindowLoad() was never called
      $autIframe.on "load", =>
        ## if setting these props failed
        ## then we know we're in a cross origin failure
        try
          setWindowDocumentProps(getContentWindow($autIframe), state)

          ## else we're good to go, and can continue executing
          ## cypress commands!
          ## TODO: i dont think we need to reapply window listeners either
          ## since we already did it during the onBeforeAutWindowLoad

          ## TODO: uncomment these lines
          # @urlChanged(null, {log: false})
          # @pageLoading(false)

          ## we reapply window listeners on load even though we
          ## applied them already during onBeforeLoad. the reason
          ## is that after load javascript has finished being evaluated
          ## and we may need to override things like alert + confirm again
          # @isReady(true, "load")
          # @Cypress.trigger("load")
        catch err
          ## catch errors associated to cross origin iframes
          if ready = state("ready")
            ready.reject(err)
          else
            errors.fail(err)

    addCommand: ({key, fn, type, enforceDom}) ->
      ## TODO: prob don't need this anymore
      commandFns[key] = fn

      prepareSubject = (firstCall, args) =>
        ## if this is the very first call
        ## on the chainer then make the first
        ## argument undefined (we have no subject)
        if firstCall
          @_removeSubject()

        subject = state("subject")

        if enforceDom
          @ensureDom(subject, key)

        args.unshift(subject)

        ## TODO: handle this event
        # @trigger("next:subject:prepared", subject, args)

        args

      wrap = (firstCall) =>
        fn = commandFns[key]
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
                    cmd:  key
                    args: $utils.stringify(args)
                  }
                })

              ## push the subject into the args
              args = prepareSubject(firstCall, args)

              subject = args[0]

              ret = orig.apply(@, args)

              return ret ? subject

      cy[key] = (args...) ->
        if not state("runnable")
          $utils.throwErrByPath("miscellaneous.outside_test")

        ## this is the first call on cypress
        ## so create a new chainer instance
        chain = $Chainer.create(cy, key, args)

        ## store the chain so we can access it later
        state("chain", chain)

        return chain

      ## add this function to our chainer class
      $Chainer.inject key, (chainerId, firstCall, args) ->
        ## dont enqueue / inject any new commands if
        ## onInjectCommand returns false
        onInjectCommand = state("onInjectCommand")

        if _.isFunction(onInjectCommand)
          return if onInjectCommand.call(cy, key, args...) is false

        cy.enqueue(key, wrap(firstCall), args, type, chainerId)

        return true

    now: (name, args...) ->
      commandFns[name].apply(cy, args)

    enqueue: (key, fn, args, type, chainerId) ->
      clearImmediate(state("timerId"))

      obj = {name: key, ctx: @, fn: fn, args: args, type: type, chainerId: chainerId}

      Cypress.action("cy:command:enqueue", obj)

      ## TODO: can't we join this method with whats below it
      cy.insertCommand(obj)

    insertCommand: (obj) ->
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

      ## if nestedIndex is either undefined or 0
      ## then we know we're processing regular commands
      ## and not splicing in the middle of our commands
      if not nestedIndex
        defer(cy.run)

    setRunnable: (runnable, hookName) ->
      if _.isFinite(timeout = config("defaultCommandTimeout"))
        runnable.timeout(timeout)

      state("hookName", hookName)

      ## we store runnable as a property because
      ## we can't allow it to be reset with props
      ## since it is long lived (page events continue)
      ## after the tests have finished
      state("runnable", runnable)

    onBeforeAutWindowLoad: (contentWindow) ->
      ## TODO: probably dont want to silence the console anymore
      # @cy.silenceConsole(contentWindow) if Cypress.isHeadless
      setWindowDocumentProps(contentWindow, state)

      $Listeners.bindTo(contentWindow, {
        onSubmit: (e) ->
        onBeforeUnload: (e) ->
        onHashChange: (e) ->
        onAlert: (str) ->
        onConfirm: (str) ->
      })

    getStyles: ->
      snapshots.getStyles()

    checkForEndedEarly: ->
      ## if our index is above 0 but is below the commands.length
      ## then we know we've ended early due to a done() and
      ## we should throw a very specific error message
      index = state("index")
      if index > 0 and index < queue.length
        errors.endedEarlyErr(index, queue)

    run: ->
      ## bail if we've been told to abort in case
      ## an old command continues to run after
      if aborted
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

        return cy.run()

      ## if we're at the very end
      if not command

        ## trigger end event
        ## TODO: handle this 'end' event
        # trigger("end")

        ## and we should have a next property which
        ## holds mocha's .then callback fn
        if next = state("next")
          next()
          state("next", null)

        return

      ## store the previous timeout
      prevTimeout = timeouts.timeout()

      ## store the current runnable
      runnable = state("runnable")

      ## TODO: handle this event
      # @trigger "command:start", command
      promise = cy
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

        # TODO: handle this event
        # @trigger "command:end", command

        if fn = state("onPaused")
          fn.call(cy, cy.run)
        else
          ## automatically defer running each command in succession
          ## so each command is async
          ## TODO: do we have to do this?
          # defer(cy.run)
          cy.run()

        # ## must have this empty return here else we end up creating
        # ## additional .then callbacks due to bluebird chaining
        # return null

      .catch Promise.CancellationError, (err) =>
        cancel(err)

        ## need to signify we're done our promise here
        ## so we cannot chain off of it, or have bluebird
        ## accidentally chain off of the return value
        return err

      .catch(fail)

      ## signify we are at the end of the chain and do not
      ## continue chaining anymore
      # promise.done()

      state("promise", promise)

      ## TODO: handle this event
      # @trigger("set", command)

    set: (command) ->
      state("current", command)

      promise = if state("ready")
        Promise.resolve state("ready").promise
      else
        Promise.resolve()

      promise.cancellable().then =>
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

        ## rewrap all functions by checking
        ## the chainer id before running its fn
        ## TODO: fix this
        # @_checkForNewChain command.get("chainerId")

        ## run the command's fn
        ret = command.get("fn").apply(command.get("ctx"), args)

        ## allow us to immediately tap into
        ## return value of our command
        ## TODO: handle this event
        # @trigger "command:returned:value", command, ret

        ## we cannot pass our cypress instance or our chainer
        ## back into bluebird else it will create a thenable
        ## which is never resolved
        if isCy(ret) then null else ret

      .then (subject) =>
        ## if ret is a DOM element and its not an instance of our jQuery
        if subject and $utils.hasElement(subject) and not $utils.isInstanceOf(subject, $)
          ## set it back to our own jquery object
          ## to prevent it from being passed downstream
          subject = cy.$$(subject)

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

        ## TODO: handle this event
        # @trigger "invoke:end", command

        ## we must look back at the ready property
        ## at the end of resolving our command because
        ## its possible it has become "unready" such
        ## as beforeunload firing. in that case before
        ## resolving we need to ensure it finishes first
        if ready = state("ready")
          if ready.promise.isPending()
            return ready.promise
            .then =>
              ## if we became unready when a command
              ## was being resolved then we need to
              ## null out the subject here and additionally
              ## check for child commands and error if found
              ## only if this is a DOM subject
              ##
              ## since we delay the resolving
              ## of our command subjects, they may have
              ## caused a page load / form submit so
              ## if our subject has been nulled we need
              ## to keep it nulled
              if state("pageChangeEvent")
                state("pageChangeEvent", false)

                ## if we currently have a DOM subject and its not longer
                ## in the document then we need to null out our subject because
                ## a page change has happened and we want to discontinue chaining
                if $utils.hasElement(subject) and not elements.isInDom(subject)
                  ## additionally check for errors here
                  ## so we can notify the user if they're trying
                  ## to chain child commands off of this null subject
                  @_removeSubject()

                return state("subject")
            .catch (err) ->

        return state("subject")
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

  return cy

module.exports = {
  create
}
