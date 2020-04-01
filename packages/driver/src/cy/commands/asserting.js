_ = require("lodash")
$ = require("jquery")
Promise = require("bluebird")

$dom = require("../../dom")
$errUtils = require("../../cypress/error_utils")

bRe            = /(\*\*)(.+)(\*\*)/
bTagOpen       = /\*\*/g
bTagClosed     = /\*\*/g
reExistence    = /exist/
reEventually   = /^eventually/
reHaveLength   = /length/

convertTags = (str) ->
  ## must first escape these characters
  ## since we will be inserting them
  ## as real html
  str = _.escape(str)

  ## bail if matches werent found
  return str if not bRe.test(str)

  str
    .replace(bTagOpen, ": <strong>")
    .replace(bTagClosed, "</strong>")
    .split(" :").join(":")

convertMessage = ($row, message) ->
  message = convertTags(message)

  $row.find("[data-js=message]").html(message)

convertRowFontSize = ($row, message) ->
  len = message.length

  ## bail if this isnt a huge message
  return if len < 100

  ## else reduce the font-size down to 85%
  ## and reduce the line height
  $row.css({
    fontSize: "85%"
    lineHeight: "14px"
  })

module.exports = (Commands, Cypress, cy, state, config) ->
  shouldFnWithCallback = (subject, fn) ->
    Promise
    .try =>
      remoteSubject = cy.getRemotejQueryInstance(subject)

      fn.call(@, remoteSubject ? subject)
    .return(subject)

  shouldFn = (subject, chainers, args...) ->
    if _.isFunction(chainers)
      return shouldFnWithCallback.apply(@, arguments)

    exp = cy.expect(subject).to
    originalChainers = chainers

    throwAndLogErr = (err) =>
      ## since we are throwing our own error
      ## without going through the assertion we need
      ## to ensure our .should command gets logged
      log = Cypress.log({
        name: "should"
        type: "child"
        message: [].concat(originalChainers, args)
        end: true
        snapshot: true
        error: err
      })

      $errUtils.throwErr(err, { onFail: log })

    chainers = chainers.split(".")
    lastChainer = _.last(chainers)

    ## backup the original assertion subject
    originalObj = exp._obj

    options = {}

    if reEventually.test(chainers)
      err = $errUtils.cypressErrByPath('should.eventually_deprecated')
      err.retry = false
      throwAndLogErr(err)

    ## are we doing a length assertion?
    if reHaveLength.test(chainers) or reExistence.test(chainers)
      isCheckingExistence = true

    applyChainer = (memo, value) ->
      if value is lastChainer
        if _.isFunction(memo[value])
          try
            memo[value].apply(memo, args)
          catch err
            ## if we made it all the way to the actual
            ## assertion but its set to retry false then
            ## we need to log out this .should since there
            ## was a problem with the actual assertion syntax
            if err.retry is false
              throwAndLogErr(err)
            else
              throw err
        else
          memo[value]
      else
        memo[value]

    applyChainers = ->
      ## if we're not doing existence or length assertions
      ## then check to ensure the subject exists
      ## in the DOM if its a DOM subject
      ## because its possible we're asserting about an
      ## element which has left the DOM and we always
      ## want to auto-fail on those
      if not isCheckingExistence and $dom.isElement(subject)
        cy.ensureAttached(subject, "should")

      newExp = _.reduce chainers, (memo, value) =>
        if value not of memo
          err = $errUtils.cypressErrByPath('should.chainer_not_found', { args: { chainer: value } })
          err.retry = false
          throwAndLogErr(err)

        applyChainer(memo, value)

      , exp

      exp = newExp ? exp

    Promise.try(applyChainers).then ->
      ## if the _obj has been mutated then we
      ## are chaining assertion properties and
      ## should return this new subject
      if originalObj isnt exp._obj
        return exp._obj

      return subject


  Commands.addAll({ type: "assertion", prevSubject: true },{
    should: ->
      shouldFn.apply(@, arguments)

    and: ->
      shouldFn.apply(@, arguments)
  })
