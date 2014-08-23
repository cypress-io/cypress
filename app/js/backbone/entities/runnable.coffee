@App.module "Entities", (Entities, App, Backbone, Marionette, $, _) ->

  class Entities.Runnable extends Entities.Model
    defaults: ->
      state: "processing"
      indent: -10
      open: false
      children:  new Entities.RunnableCollection
      commands: App.request("command:entities")

    initialize: ->
      new Backbone.Chooser(@)

    ## toggles open true|false
    toggleOpen: ->
      @set "open", !@get("open")

    setAttrsFromRunnable: (runnable, index) ->
      @set
        id: runnable.cid
        title: runnable.originalTitle()
        parentId: runnable.parent.cid
        parentRoot: runnable.parent.root
        index: index

    addRunnable: (model) ->
      ## if we're already a part of a collection and our index
      ## attribute is changing, we need to resort the collection
      sort = model.hasChanged("index") and !!model.collection

      ## reset its indent
      model.set "indent", @get("indent") + 20

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

    addCommand: (command) ->
      @get("commands").add command

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
      if @is("test") then @resetTest() else @resetSuite()

    resetSuite: ->
      @get("children").invoke("reset")

    resetTest: ->
      @removeOriginalError()

      ## reset these specific attributes
      _.each ["state", "duration", "error"], (key) =>
        @unset key

      ## remove the models within our commands collection
      @get("commands").reset()

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
        ## output the error to the console to receive stack trace
        console.error(test.err)

        ## backup the original error to output to the console
        @originalError = test.err

        ## set the err on the attrs
        attrs.error = test.err.stack or test.err.toString()
      else
        ## remove the original error in case it exists
        @removeOriginalError()

        ## reset the error attribute to null so we remove any
        ## existing error message
        attrs.error = null

      ## set the private _slow and _timeout
      ## based on the result of these methods
      @_slow = test.slow()
      @_timeout = test.timeout()

      @set attrs

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