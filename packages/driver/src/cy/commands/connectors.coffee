_ = require("lodash")
Promise = require("bluebird")

$dom = require("../../dom")
$utils = require("../../cypress/utils")

returnFalseIfThenable = (key, args...) ->
  if key is "then" and _.isFunction(args[0]) and _.isFunction(args[1])
    ## https://github.com/cypress-io/cypress/issues/111
    ## if we're inside of a promise then the promise lib will naturally
    ## pass (at least) two functions to another cy.then
    ## this works similar to the way mocha handles thenables. for instance
    ## in coffeescript when we pass cypress commands within a Promise's
    ## .then() because the return value is the cypress instance means that
    ## the Promise lib will attach a new .then internally. it would never
    ## resolve unless we invoked it immediately, so we invoke it and
    ## return false then ensuring the command is not queued
    args[0]()
    return false

module.exports = (Commands, Cypress, cy, state, config) ->
  ## thens can return more "thenables" which are not resolved
  ## until they're 'really' resolved, so naturally this API
  ## supports nesting promises
  thenFn = (subject, options, fn) ->
    ctx = @

    if _.isFunction(options)
      fn = options
      options = {}

    _.defaults options,
      timeout: cy.timeout()

    ## clear the timeout since we are handling
    ## it ourselves
    cy.clearTimeout()

    ## TODO: use subject from state("subject")

    remoteSubject = cy.getRemotejQueryInstance(subject)

    args = remoteSubject or subject
    args = if subject?._spreadArray then args else [args]

    ## name could be invoke or its!
    name = state("current").get("name")

    cleanup = ->
      state("onInjectCommand", undefined)
      cy.removeListener("command:enqueued", enqueuedCommand)
      return null

    invokedCyCommand = false

    enqueuedCommand = ->
      invokedCyCommand = true

    state("onInjectCommand", returnFalseIfThenable)

    cy.once("command:enqueued", enqueuedCommand)

    ## this code helps juggle subjects forward
    ## the same way that promises work
    current = state("current")
    next    = current.get("next")

    ## TODO: this code may no longer be necessary
    ## if the next command is chained to us then when it eventually
    ## runs we need to reset the subject to be the return value of the
    ## previous command so the subject is continuously juggled forward
    if next and next.get("chainerId") is current.get("chainerId")
      checkSubject = (newSubject, args) ->
        return if state("current") isnt next

        ## get whatever the previous commands return
        ## value is. this likely does not match the 'var current'
        ## command in the case of nested cy commands
        s = next.get("prev").get("subject")

        ## find the new subject and splice it out
        ## with our existing subject
        index = _.indexOf(args, newSubject)
        if index > -1
          args.splice(index, 1, s)

        cy.removeListener("next:subject:prepared", checkSubject)

      cy.on("next:subject:prepared", checkSubject)

    getRet = ->
      ret = fn.apply(ctx, args)

      if cy.isCy(ret)
        ret = undefined

      if ret? and invokedCyCommand and not ret.then
        $utils.throwErrByPath("then.callback_mixes_sync_and_async", {
          onFail: options._log
          args: { value: $utils.stringify(ret) }
        })

      return ret

    Promise
    .try(getRet)
    .timeout(options.timeout)
    .then (ret) ->
      ## if ret is undefined then
      ## resolve with the existing subject
      return if _.isUndefined(ret) then subject else ret
    .catch Promise.TimeoutError, ->
      $utils.throwErrByPath "invoke_its.timed_out", {
        onFail: options._log
        args: {
          cmd: name
          timeout: options.timeout
          func: fn.toString()
        }
      }
    .finally(cleanup)

  invokeFn = (subject, fn, args...) ->
    options = {}

    getMessage = ->
      if name is "invoke"
        ".#{fn}(" + $utils.stringify(args) + ")"
      else
        ".#{fn}"

    ## name could be invoke or its!
    name = state("current").get("name")

    message = getMessage()

    options._log = Cypress.log
      message: message
      $el: if $dom.isElement(subject) then subject else null
      consoleProps: ->
        Subject: subject

    if not _.isString(fn)
      $utils.throwErrByPath("invoke_its.invalid_1st_arg", {
        onFail: options._log
        args: { cmd: name }
      })

    if name is "its" and args.length > 0
      $utils.throwErrByPath("invoke_its.invalid_num_of_args", {
        onFail: options._log
        args: { cmd: name }
      })

    fail = (prop) ->
      $utils.throwErrByPath("invoke_its.invalid_property", {
        onFail: options._log
        args: { prop, cmd: name }
      })

    failOnPreviousNullOrUndefinedValue = (previousProp, currentProp, value) ->
      $utils.throwErrByPath("invoke_its.previous_prop_nonexistent", {
        args: { previousProp, currentProp, value, cmd: name }
      })

    failOnCurrentNullOrUndefinedValue = (prop, value) ->
      $utils.throwErrByPath("invoke_its.current_prop_nonexistent", {
        args: { prop, value, cmd: name }
      })

    getReducedProp = (str, subject) ->
      getValue = (memo, prop) ->
        switch
          when _.isString(memo)
            new String(memo)
          when _.isNumber(memo)
            new Number(memo)
          else
            memo

      _.reduce str.split("."), (memo, prop, index, array) ->

        ## if the property does not EXIST on the subject
        ## then throw a specific error message
        try
          memo[prop]
        catch e
          ## if the value is null or undefined then it does
          ## not have properties which causes us to throw
          ## an even more particular error
          if _.isNull(memo) or _.isUndefined(memo)
            if index > 0
              failOnPreviousNullOrUndefinedValue(array[index - 1], prop, memo)
            else
              failOnCurrentNullOrUndefinedValue(prop, memo)
          else
            throw e
        return memo[prop]

      , subject

    getValue = ->
      remoteSubject = cy.getRemotejQueryInstance(subject)

      actualSubject = remoteSubject or subject

      prop = getReducedProp(fn, actualSubject)

      invoke = ->
        switch name
          when "its"
            prop
          when "invoke"
            if _.isFunction(prop)
              prop.apply(actualSubject, args)
            else
              $utils.throwErrByPath("invoke.invalid_type", {
                onFail: options._log
                args: { prop: fn }
              })

      getFormattedElement = ($el) ->
        if $dom.isElement($el)
          $dom.getElements($el)
        else
          $el

      value = invoke()

      if options._log
        options._log.set
          consoleProps: ->
            obj = {}

            if name is "invoke"
              obj["Function"] = message
              obj["With Arguments"] = args if args.length
            else
              obj["Property"] = message

            _.extend obj,
              On:       getFormattedElement(actualSubject)
              Yielded: getFormattedElement(value)

            obj

      return value

    ## wrap retrying into its own
    ## separate function
    retryValue = ->
      Promise
      .try(getValue)
      .catch (err) ->
        options.error = err
        cy.retry(retryValue, options)

    do resolveValue = ->
      Promise.try(retryValue).then (value) ->
        cy.verifyUpcomingAssertions(value, options, {
          onRetry: resolveValue
        })

  Commands.addAll({ prevSubject: true }, {
    spread: (subject, options, fn) ->
      ## if this isnt an array-like blow up right here
      if not _.isArrayLike(subject)
        $utils.throwErrByPath("spread.invalid_type")

      subject._spreadArray = true

      thenFn(subject, options, fn)

    each: (subject, options, fn) ->
      ctx = @

      if _.isUndefined(fn)
        fn = options
        options = {}

      if not _.isFunction(fn)
        $utils.throwErrByPath("each.invalid_argument")

      nonArray = ->
        $utils.throwErrByPath("each.non_array", {
          args: {subject: $utils.stringify(subject)}
        })

      try
        if "length" not of subject
          nonArray()
      catch e
        nonArray()

      if subject.length is 0
        return subject

      ## if we have a next command then we need to
      ## slice in this existing subject as its subject
      ## due to the way we queue promises
      next = state("current").get("next")
      if next
        checkSubject = (newSubject, args) ->
          return if state("current") isnt next

          ## find the new subject and splice it out
          ## with our existing subject
          index = _.indexOf(args, newSubject)
          if index > -1
            args.splice(index, 1, subject)

          cy.removeListener("next:subject:prepared", checkSubject)

        cy.on("next:subject:prepared", checkSubject)

      endEarly = false

      yieldItem = (el, index) ->
        return if endEarly

        if $dom.isElement(el)
          el = $dom.wrap(el)

        callback = ->
          ret = fn.call(ctx, el, index, subject)

          ## if the return value is false then return early
          if ret is false
            endEarly = true

          return ret

        thenFn(el, options, callback, state)

      ## generate a real array since bluebird is finicky and
      ## doesnt want an 'array-like' structure like jquery instances
      ## need to take into account regular arrays here by first checking
      ## if its an array instance
      Promise
      .each(_.toArray(subject), yieldItem)
      .return(subject)
  })

  ## temporarily keeping this as a dual command
  ## but it will move to a child command once
  ## cy.resolve + cy.wrap are upgraded to handle
  ## promises
  Commands.addAll({ prevSubject: "optional" }, {
    then: ->
      thenFn.apply(@, arguments)
  })

  Commands.addAll({ prevSubject: true }, {
    ## making this a dual command due to child commands
    ## automatically returning their subject when their
    ## return values are undefined.  prob should rethink
    ## this and investigate why that is the default behavior
    ## of child commands
    invoke: ->
      invokeFn.apply(@, arguments)

    its: ->
      invokeFn.apply(@, arguments)
  })
