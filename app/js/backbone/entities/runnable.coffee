@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Runnable extends Entities.Model
    defaults: ->
      state: "processing"
      indent: -10
      open: false
      error: null
      hook: null
      children:  new Entities.RunnableCollection
      hooks: App.request("hook:entities")
      routes: App.request("route:entities")

    initialize: ->
      new Backbone.Chooser(@)

    ## toggles open true|false
    toggleOpen: ->
      @set "open", !@get("open")

    failHookByName: (name) ->
      hook = @get("hooks").getByName(name)

      ## its possible that we dont have any models in our hooks collection
      ## if there were no Ecl commands run in the specific hook since
      ## we don't create the hooks collection UNTIL a valid command runs.
      ## we probably want to change this logic around to always create
      ## a hooks collection if the hook ever ran, regardless of how many
      ## commands passed within each hook
      hook.failed() if hook

    checkForFailedHook: ->
      ## bail if our hook property is falsy
      return if not name = @get("hook")

      ## else continue to fail the hook by name
      @failHookByName(name)

    setAttrsFromRunnable: (runnable, index) ->
      @set
        id: runnable.cid
        title: _.result(runnable, "originalTitle")
        parentId: runnable.parent.cid
        parentRoot: runnable.parent.root
        index: index

    addRunnable: (model) ->
      ## if we're already a part of a collection and our index
      ## attribute is changing, we need to resort the collection
      sort = model.hasChanged("index") and !!model.collection

      ## reset its indent
      model.set "indent", @get("indent") + 15

      ## add the model, which if it exists will simply merge
      ## in the model attribute changes
      @get("children").add(model, merge: true)

      ## sort the collection manually if sort was true.  this has
      ## to be here because collections will not resort unless models
      ## are added or removed.  when we change a models comparator
      ## attribute (index) -- we need to resort the collection ourselves
      @get("children").sort() if sort

    remove: ->
      @collection.remove(@)

    addCommand: (command, options = {}) ->
      hook = command.get("hook")
      @get("hooks").addCommandToHook hook, command, options

    addRoute: (route, options = {}) ->
      @get("routes").add(route)

    incrementRoute: (route) ->
      @get("routes").increment(route)

    is: (type) ->
      @get("type") is type

    ## did our test take a long time to run?
    isSlow: ->
      @get("duration") > @_slow

    timedOut: ->
      @get("duration") > @_timeout

    ## always open the commands when a test is chosen
    onChoose: ->
      @set "open", true if @is("test")

    ## when our tests are unchosen we want to close their open state
    collapse: ->
      @set "open", false if @is("test")

    reset: ->
      @resetRunnable()
      @get("children").invoke("reset")

    anyCommandsFailed: ->
      @get("hooks").anyFailed()

    resetRunnable: ->
      @removeOriginalError()

      ## reset these specific attributes
      _.each ["state", "duration", "error", "hook"], (key) =>
        @unset key

      ## remove the models within our commands collection
      @get("hooks").reset([], {silent: true})

      ## merge in the defaults unless we already have them set
      defaults = _(@).result "defaults"
      attributes = _(@attributes).keys()
      @set _(defaults).omit(attributes...)

    removeOriginalError: ->
      delete @originalError

    setResults: (test) ->
      ## dont use underscore pick here because we'll most likely
      ## have to do some property translation from other frameworks

      ## we have to normalize the state by first looking at whether
      ## its pending (because then it wont have a state)
      attrs =
        state:    if test.pending then "pending" else test.state
        duration: test.duration

      if test.err
        test.err = @parseErrorFromString(test.err) if _.isString(test.err)

        ## backup the original error to output to the console
        @originalError = test.err

        ## set the err on the attrs
        attrs.error = _.result test.err, "toString"

        ## get the hook type (beforeEach, afterEach, etc)
        ## if the test failed from a hook
        attrs.hook = test.hook if test.failedFromHook
      else
        ## remove the original error in case it exists
        @removeOriginalError()

        ## reset the error attribute to null so we remove any
        ## existing error message
        attrs.error = null

        ## remove the hook as well
        attrs.hook = null

      ## set the private _slow and _timeout
      ## based on the result of these methods
      @_slow    = _.result test, "slow"
      @_timeout = _.result test, "timeout"

      @set attrs

      ## check to see if we have a failed hook
      @checkForFailedHook()

      return @

    ## rewrites the error stack and
    ## manually corrects the root host domain
    ## which allows these to be clickable
    parseErrStack: (stack, host) ->
      re = new RegExp(host, "g")
      stack.replace re, window.location.host

    ## creates a new error instance and
    ## sets its properties from the error string
    parseErrorFromString: (err) ->
      obj = JSON.parse(err)
      obj.stack = @parseErrStack(obj.stack, obj.host) if obj.stack

      err = new Error()

      _.chain(obj).keys().each (key) ->
        err[key] = obj[key]

      return err

    anyAreProcessing: (states) ->
      _(states).any (state) -> state is "processing"

    anyAreFailed: (states) ->
      _(states).any (state) -> state is "failed"

    allArePassed: (states) ->
      _(states).all (state) -> state is "passed"

    allArePending: (states) ->
      _(states).all (state) -> state is "pending"

    updateState: ->
      ## grab all of the states of the tests
      states = @get("children").pluck("state")

      state = switch
        when @anyAreProcessing(states) then "processing"
        when @anyAreFailed(states) then "failed"
        when @allArePassed(states) then "passed"
        when @allArePending(states) then "pending"

      @set state: state

  class Entities.RunnableCollection extends Entities.Collection
    model: Entities.Runnable

    comparator: "index"

  API =
    newRoot: ->
      root = new Entities.Runnable
      root.set root: true
      root

    newRunnable: (type) ->
      new Entities.Runnable type: type

  App.reqres.setHandler "new:root:runnable:entity", ->
    API.newRoot()

  App.reqres.setHandler "runnable:entity", (type) ->
    API.newRunnable type