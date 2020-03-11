## tests in driver/test/cypress/integration/commands/assertions_spec.coffee

_ = require("lodash")
$ = require("jquery")
chai = require("chai")
sinonChai = require("@cypress/sinon-chai")

$dom = require("../dom")
$utils = require("../cypress/utils")
$chaiJquery = require("../cypress/chai_jquery")
$ChaiFactory = require('../cypress/chai_factory')

## all words between single quotes which are at
## the end of the string
allPropertyWordsBetweenSingleQuotes = /('.*?')$/g

## grab all words between single quotes except
## when the single quote word is the LAST word
allButLastWordsBetweenSingleQuotes = /('.*?')(.+)/g

allBetweenFourStars = /\*\*.*\*\*/
allSingleQuotes = /'/g
allEscapedSingleQuotes = /\\'/g
allQuoteMarkers = /__quote__/g
allWordsBetweenCurlyBraces  = /(#{.+?})/g
allQuadStars = /\*\*\*\*/g

chaiUtils = $ChaiFactory.utils

{ getMessage } = chaiUtils

removeOrKeepSingleQuotesBetweenStars = (message) ->
  ## remove any single quotes between our **, preserving escaped quotes
  ## and if an empty string, put the quotes back
  message.replace allBetweenFourStars, (match) ->
    match
      .replace(allEscapedSingleQuotes, "__quote__") # preserve escaped quotes
      .replace(allSingleQuotes, "")
      .replace(allQuoteMarkers, "'") ## put escaped quotes back
      .replace(allQuadStars, "**''**") ## fix empty strings that end up as ****

replaceArgMessages = (args, str) ->
  _.reduce args, (memo, value, index) =>
    if _.isString(value)
      value = value
        .replace(allWordsBetweenCurlyBraces,          "**$1**")
        .replace(allEscapedSingleQuotes,              "__quote__")
        .replace(allButLastWordsBetweenSingleQuotes,  "**$1**$2")
        .replace(allPropertyWordsBetweenSingleQuotes, "**$1**")
      memo.push value
    else
      memo.push value

    memo
  , []

overrideChaiAsserts = (chai, assertFn) ->
  { Assertion } = chai

  chaiUtils.getMessage = (assert, args) ->
    obj = assert._obj

    ## if we are formatting a DOM object
    if $dom.isDom(obj)
      ## replace object with our formatted one
      assert._obj = $dom.stringify(obj, "short")

    msg = getMessage.call(@, assert, args)

    ## restore the real obj if we changed it
    if obj isnt assert._obj
      assert._obj = obj

    return msg

  Assertion.overwriteMethod "match", (_super) ->
    return (regExp) ->
      if _.isRegExp(regExp) or $dom.isDom(@_obj)
        _super.apply(@, arguments)
      else
        err = $utils.cypressErr($utils.errMessageByPath("chai.match_invalid_argument", { regExp }))
        err.retry = false
        throw err

  containFn1 = (_super) ->
    return (text) ->
      obj = @_obj

      if not ($dom.isJquery(obj) or $dom.isElement(obj))
        return _super.apply(@, arguments)

      escText = $utils.escapeQuotes(text)

      selector = ":contains('#{escText}'), [type='submit'][value~='#{escText}']"

      ## the assert checks below only work if $dom.isJquery(obj)
      ## https://github.com/cypress-io/cypress/issues/3549
      if not ($dom.isJquery(obj))
        obj = $(obj)

      @assert(
        obj.is(selector) or !!obj.find(selector).length
        'expected #{this} to contain #{exp}'
        'expected #{this} not to contain #{exp}'
        text
      )

  containFn2 = (_super) ->
    return ->
      _super.apply(@, arguments)

  Assertion.overwriteChainableMethod("contain", containFn1, containFn2)

  Assertion.overwriteChainableMethod "length",
    fn1 = (_super) ->
      return (length) ->
        obj = @_obj

        if not ($dom.isJquery(obj) or $dom.isElement(obj))
          return _super.apply(@, arguments)

        length = $utils.normalizeNumber(length)

        ## filter out anything not currently in our document
        if $dom.isDetached(obj)
          obj = @_obj = obj.filter (index, el) ->
            $dom.isAttached(el)

        node = if obj and obj.length then $dom.stringify(obj, "short") else obj.selector

        ## if our length assertion fails we need to check to
        ## ensure that the length argument is a finite number
        ## because if its not, we need to bail on retrying
        try
          @assert(
            obj.length is length,
            "expected '#{node}' to have a length of \#{exp} but got \#{act}",
            "expected '#{node}' to not have a length of \#{act}",
            length,
            obj.length
          )

        catch e1
          e1.node = node
          e1.negated = chaiUtils.flag(@, "negate")
          e1.type = "length"

          if _.isFinite(length)
            getLongLengthMessage = (len1, len2) ->
              if len1 > len2
                "Too many elements found. Found '#{len1}', expected '#{len2}'."
              else
                "Not enough elements found. Found '#{len1}', expected '#{len2}'."

            e1.displayMessage = getLongLengthMessage(obj.length, length)
            throw e1

          e2 = $utils.cypressErr($utils.errMessageByPath("chai.length_invalid_argument", { length }))
          e2.retry = false
          throw e2

    fn2 = (_super) ->
      return ->
        _super.apply(@, arguments)

  Assertion.overwriteProperty "exist", (_super) ->
    return ->
      obj = @_obj

      if not ($dom.isJquery(obj) or $dom.isElement(obj))
        try
          _super.apply(@, arguments)
        catch e
          e.type = "existence"
          throw e
      else
        if not obj.length
          @_obj = null

        node = if obj and obj.length then $dom.stringify(obj, "short") else obj.selector

        try
          @assert(
            isAttached = $dom.isAttached(obj),
            "expected \#{act} to exist in the DOM",
            "expected \#{act} not to exist in the DOM",
            node,
            node
          )
        catch e1
          e1.node = node
          e1.negated = chaiUtils.flag(@, "negate")
          e1.type = "existence"

          getLongExistsMessage = (obj) ->
            ## if we expected not for an element to exist
            if isAttached
              "Expected #{node} not to exist in the DOM, but it was continuously found."
            else
              "Expected to find element: '#{obj.selector}', but never found it."

          e1.displayMessage = getLongExistsMessage(obj)
          throw e1

  Assertion.prototype.assert = overrideAssertionAssert(Assertion, assertFn)

overrideExpect = (chai) ->
  ## only override assertions for this specific
  ## expect function instance so we do not affect
  ## the outside world
  return (val, message) ->
    ## make the assertion
    return new chai.Assertion(val, message)

overrideAssert = (chai) ->
  fn = (express, errmsg) ->
    chai.assert(express, errmsg)

  fns = _.functions(chai.assert)

  _.each fns, (name) ->
    fn[name] = ->
      chai.assert[name].apply(@, arguments)

  return fn

overrideAssertionAssert = (Assertion, assertFn) ->
  assertProto = Assertion.prototype.assert

  Assertion.prototype.assert = (args...) ->
    passed    = chaiUtils.test(@, args)
    value     = chaiUtils.flag(@, "object")
    expected  = args[3]

    customArgs = replaceArgMessages(args, @_obj)

    message   = chaiUtils.getMessage(@, customArgs)
    actual    = chaiUtils.getActual(@, customArgs)

    message = removeOrKeepSingleQuotesBetweenStars(message)

    try
      assertProto.apply(@, args)
    catch e
      err = e

    assertFn(passed, message, value, actual, expected, err)

    throw err if err

useChaiJquery = (chai) ->
  $chaiJquery(chai, chai.util, {
    onInvalid: (method, obj) ->
      err = $utils.cypressErr(
        $utils.errMessageByPath(
          "chai.invalid_jquery_obj", {
            assertion: method
            subject: $utils.stringifyActual(obj)
          }
        )
      )

      throw err

    onError: (err, method, obj, negated) ->
      switch method
        when "visible"
          if not negated
            ## add reason hidden unless we expect the element to be hidden
            reason = $dom.getReasonIsHidden(obj)
            err.message += "\n\n" + reason

      ## always rethrow the error!
      throw err
  })

create = (specWindow, assertFn) ->
  chai = $ChaiFactory.create()

  chai.use(sinonChai)

  expect = overrideExpect(chai)
  assert = overrideAssert(chai)

  overrideChaiAsserts(chai, assertFn)
  useChaiJquery(chai)

  specWindow.chai = chai
  specWindow.expect = expect
  specWindow.assert = assert

  return {
    chai,
    assert,
    expect,
  }

module.exports = {
  create
}
