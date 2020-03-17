_ = require("lodash")
Promise = require("bluebird")

$dom = require("../../dom")
$utils = require("../../cypress/utils")
$errUtils = require("../../cypress/error_utils")

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

primitiveToObject = (memo) ->
  switch
    when _.isString(memo)
      new String(memo)
    when _.isNumber(memo)
      new Number(memo)
    else
      memo

getFormattedElement = ($el) ->
  if $dom.isElement($el)
    $dom.getElements($el)
  else
    $el

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

    try
      hasSpreadArray = "_spreadArray" in subject or subject?._spreadArray
    args = if hasSpreadArray then args else [args]

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
        $errUtils.throwErrByPath("then.callback_mixes_sync_and_async", {
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
      $errUtils.throwErrByPath "invoke_its.timed_out", {
        onFail: options._log
        args: {
          cmd: name
          timeout: options.timeout
          func: fn.toString()
        }
      }
    .finally(cleanup)

  invokeItsFn = (subject, str, options, args...) ->
    return invokeBaseFn(options or { log: true }, subject, str, args...)

  invokeFn = (subject, optionsOrStr, args...) ->
    optionsPassed = _.isObject(optionsOrStr) and !_.isFunction(optionsOrStr)
    options = null
    str = null

    if not optionsPassed
      str = optionsOrStr
      options = { log: true }
    else
      options = optionsOrStr
      if args.length > 0
        str = args[0]
        args = args.slice(1)

    return invokeBaseFn(options, subject, str, args...)

  invokeBaseFn = (options, subject, str, args...) ->

    ## name could be invoke or its!
    name = state("current").get("name")

    isCmdIts = name is "its"
    isCmdInvoke = name is "invoke"

    getMessage = ->
      if isCmdIts
        return ".#{str}"

      return ".#{str}(" + $utils.stringify(args) + ")"

    ## to allow the falsy value 0 to be used
    isProp = (str) -> !!str or str is 0

    message = getMessage()

    traversalErr = null

    if options.log
      options._log = Cypress.log
        message: message
        $el: if $dom.isElement(subject) then subject else null
        consoleProps: ->
          Subject: subject

    ## check for false positive (negative?) with 0 given as index
    if not isProp(str)
      $errUtils.throwErrByPath("invoke_its.null_or_undefined_property_name", {
        onFail: options._log
        args: { cmd: name, identifier: if isCmdIts then "property" else "function" }
      })

    if not _.isString(str) and not _.isNumber(str)
      $errUtils.throwErrByPath("invoke_its.invalid_prop_name_arg", {
        onFail: options._log
        args: { cmd: name, identifier: if isCmdIts then "property" else "function" }
      })

    if not _.isObject(options) or _.isFunction(options)
      $errUtils.throwErrByPath("invoke_its.invalid_options_arg", {
        onFail: options._log
        args: { cmd: name }
      })

    if isCmdIts and args and args.length > 0
      $errUtils.throwErrByPath("invoke_its.invalid_num_of_args", {
        onFail: options._log
        args: { cmd: name }
      })

    propertyNotOnSubjectErr = (prop) ->
      $errUtils.cypressErrByPath("invoke_its.nonexistent_prop", {
        args: {
          prop,
          cmd: name
        }
      })

    propertyValueNullOrUndefinedErr = (prop, value) ->
      errMessagePath = if isCmdIts then "its" else "invoke"

      $errUtils.cypressErrByPath("#{errMessagePath}.null_or_undefined_prop_value", {
        args: {
          prop,
          value,
        }
        cmd: name
      })

    subjectNullOrUndefinedErr = (prop, value) ->
      errMessagePath = if isCmdIts then "its" else "invoke"

      $errUtils.cypressErrByPath("#{errMessagePath}.subject_null_or_undefined", {
        args: {
          prop,
          cmd: name
          value,
        }
      })

    propertyNotOnPreviousNullOrUndefinedValueErr = (prop, value, previousProp) ->
      $errUtils.cypressErrByPath("invoke_its.previous_prop_null_or_undefined", {
        args: {
          prop,
          value,
          previousProp,
          cmd: name
        }
      })

    traverseObjectAtPath = (acc, pathsArray, index = 0) ->
      ## traverse at this depth
      prop = pathsArray[index]
      previousProp = pathsArray[index - 1]
      valIsNullOrUndefined = _.isNil(acc)

      ## if we're attempting to tunnel into
      ## a null or undefined object...
      if isProp(prop) and valIsNullOrUndefined
        if index is 0
          ## give an error stating the current subject is nil
          traversalErr = subjectNullOrUndefinedErr(prop, acc)
        else
          ## else refer to the previous property so users know which prop
          ## caused us to hit this dead end
          traversalErr = propertyNotOnPreviousNullOrUndefinedValueErr(prop, acc, previousProp)

        return acc

      ## if we have no more properties to traverse
      if not isProp(prop)
        if valIsNullOrUndefined
          ## set traversal error that the final value is null or undefined
          traversalErr = propertyValueNullOrUndefinedErr(previousProp, acc)

        ## finally return the reduced traversed accumulator here
        return acc

      ## attempt to lookup this property on the acc
      ## if our property does not exist then allow
      ## undefined to pass through but set the traversalErr
      ## since if we don't have any assertions we want to
      ## provide a very specific error message and not the
      ## generic existence one
      if (prop not of primitiveToObject(acc))
        traversalErr = propertyNotOnSubjectErr(prop)

        return undefined

      ## if we succeeded then continue to traverse
      return traverseObjectAtPath(acc[prop], pathsArray, index + 1)

    getSettledValue = (value, subject, propAtLastPath) ->
      if isCmdIts
        return value

      if _.isFunction(value)
        return value.apply(subject, args)

      ## TODO: this logic should likely be part of
      ## traverseObjectAtPath(...) rather be further
      ## away from the handling of traversals. this
      ## causes us to need to separately handle
      ## the 'propAtLastPath' argument since we're
      ## outside of the reduced accumulator.

      ## if we're not a function and we have a traversal
      ## error then throw it now - since that provide a
      ## more specific error regarding non-existant
      ## properties or null or undefined values
      if traversalErr
        throw traversalErr

      ## else throw that prop isn't a function
      $errUtils.throwErrByPath("invoke.prop_not_a_function", {
        onFail: options._log
        args: {
          prop: propAtLastPath
          type: $utils.stringifyFriendlyTypeof(value)
        }
      })

    getValue = ->
      ## reset this on each go around so previous errors
      ## don't leak into new failures or upcoming assertion errors
      traversalErr = null

      remoteSubject = cy.getRemotejQueryInstance(subject)

      actualSubject = remoteSubject or subject

      if _.isString(str)
        paths = str.split(".")
      else
        paths = [str]

      prop = traverseObjectAtPath(actualSubject, paths)

      value = getSettledValue(prop, actualSubject, _.last(paths))

      if options._log
        options._log.set({
          consoleProps: ->
            obj = {}

            if isCmdInvoke
              obj["Function"] = message
              obj["With Arguments"] = args if args.length
            else
              obj["Property"] = message

            _.extend(obj, {
              Subject: getFormattedElement(actualSubject)
              Yielded: getFormattedElement(value)
            })

            return obj
        })

      return value

    ## by default we want to only add the default assertion
    ## of ensuring existence for cy.its() not cy.invoke() because
    ## invoking a function can legitimately return null or undefined
    ensureExistenceFor = if isCmdIts then "subject" else false

    ## wrap retrying into its own
    ## separate function
    retryValue = ->
      Promise
      .try(getValue)
      .catch (err) ->
        options.error = err
        cy.retry(retryValue, options)

    do resolveValue = ->
      Promise
      .try(retryValue)
      .then (value) ->
        cy.verifyUpcomingAssertions(value, options, {
          ensureExistenceFor
          onRetry: resolveValue
          onFail: (err, isDefaultAssertionErr, assertionLogs) ->
            ## if we failed our upcoming assertions and also
            ## exited early out of getting the value of our
            ## subject then reset the error to this one
            if traversalErr
              return options.error = traversalErr
        })

  Commands.addAll({ prevSubject: true }, {
    spread: (subject, options, fn) ->
      ## if this isnt an array-like blow up right here
      if not _.isArrayLike(subject)
        $errUtils.throwErrByPath("spread.invalid_type")

      subject._spreadArray = true

      thenFn(subject, options, fn)

    each: (subject, options, fn) ->
      ctx = @

      if _.isUndefined(fn)
        fn = options
        options = {}

      if not _.isFunction(fn)
        $errUtils.throwErrByPath("each.invalid_argument")

      nonArray = ->
        $errUtils.throwErrByPath("each.non_array", {
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
    invoke: (subject, optionsOrStr, args...) ->
      invokeFn.apply(@, [subject, optionsOrStr, args...])

    its: (subject, str, options, args...) ->
      invokeItsFn.apply(@, [subject, str, options, args...])
  })
