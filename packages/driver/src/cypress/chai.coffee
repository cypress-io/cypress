_ = require("lodash")
$ = require("jquery")
Backbone = require("backbone")
chai = require("chai")
chaijQuery = require("chai-jquery")
sinonChai = require("@cypress/sinon-chai")

$Dom = require("./dom")
$Utils = require("./utils")

## all words between single quotes which are at
## the end of the string
allPropertyWordsBetweenSingleQuotes = /('.*?')$/g

## grab all words between single quotes except
## when the single quote word is the LAST word
allButLastWordsBetweenSingleQuotes = /('.*?')(.+)/g

allSingleQuotes = /'/g
allEscapedSingleQuotes = /\\'/g
allQuoteMarkers = /__quote__/g
allWordsBetweenCurlyBraces  = /(#{.+?})/g
allQuadStars = /\*\*\*\*/g

$ChaiRef = null

chai.use(sinonChai)

chai.use (chai, utils) ->
  chaijQuery(chai, utils, $)

  expect       = chai.expect
  assert       = chai.assert
  assertProto  = chai.Assertion::assert
  matchProto   = chai.Assertion::match
  lengthProto  = chai.Assertion::__methods.length.method
  containProto = chai.Assertion::__methods.contain.method
  existProto   = Object.getOwnPropertyDescriptor(chai.Assertion::, "exist").get
  visibleProto = Object.getOwnPropertyDescriptor(chai.Assertion::, "visible").get
  getMessage   = utils.getMessage

  class $Chai
    constructor: (@Cypress, specWindow) ->
      @restoreAsserts()
      @override()
      @listeners()

      $Chai.setGlobals(specWindow)
      @addCustomProperties()

    addCustomProperties: ->
      _this = @

      normalizeNumber = (num) ->
        parsed = Number(num)

        ## return num if this isNaN else return parsed
        if _.isNaN(parsed) then num else parsed

      utils.getMessage = _.wrap getMessage, (orig, assert, args) ->
        obj = assert._obj

        ## if we are formatting a DOM object
        if $Utils.hasElement(obj) or $Utils.hasWindow(obj) or $Utils.hasDocument(obj)
          ## replace object with our formatted one
          assert._obj = $Utils.stringifyElement(obj, "short")

        msg = orig.call(@, assert, args)

        ## restore the real obj if we changed it
        if obj isnt assert._obj
          assert._obj = obj

        return msg

      chai.Assertion.overwriteMethod "match", (_super) ->
        return (regExp) ->
          if _.isRegExp(regExp) or $Utils.hasElement(@_obj)
            _super.apply(@, arguments)
          else
            err = $Utils.cypressErr($Utils.errMessageByPath("chai.match_invalid_argument", { regExp }))
            err.retry = false
            throw err

      chai.Assertion.overwriteChainableMethod "contain",
        fn1 = (_super) ->
          return (text) ->
            cy = _this.Cypress.cy

            obj = @_obj

            if not cy or not ($Utils.isInstanceOf(obj, $) or $Utils.hasElement(obj))
              return _super.apply(@, arguments)

            escText = $Utils.escapeQuotes(text)

            selector = ":contains('#{escText}'), [type='submit'][value~='#{escText}']"

            @assert(
              obj.is(selector) or !!obj.find(selector).length
              "expected \#{this} to contain \#{exp}"
              "expected \#{this} not to contain \#{exp}"
              text
            )

        fn2 = (_super) ->
          return ->
            _super.apply(@, arguments)

      chai.Assertion.overwriteChainableMethod "length",
        fn1 = (_super) ->
          return (length) ->
            cy = _this.Cypress.cy

            obj = @_obj

            if not cy or not ($Utils.isInstanceOf(obj, $) or $Utils.hasElement(obj))
              return _super.apply(@, arguments)

            length = normalizeNumber(length)

            ## filter out anything not currently in our document
            if not cy._contains(obj)
              obj = @_obj = obj.filter (index, el) ->
                cy._contains(el)

            node = if obj and obj.length then $Utils.stringifyElement(obj, "short") else obj.selector

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
              e1.negated = utils.flag(@, "negate")
              e1.type = "length"

              if _.isFinite(length)
                getLongLengthMessage = (len1, len2) ->
                  if len1 > len2
                    "Too many elements found. Found '#{len1}', expected '#{len2}'."
                  else
                    "Not enough elements found. Found '#{len1}', expected '#{len2}'."

                e1.displayMessage = getLongLengthMessage(obj.length, length)
                throw e1

              e2 = $Utils.cypressErr($Utils.errMessageByPath("chai.length_invalid_argument", { length }))
              e2.retry = false
              throw e2

        fn2 = (_super) ->
          return ->
            _super.apply(@, arguments)

      chai.Assertion.overwriteProperty "visible", (_super) ->
        return ->
          try
            _super.apply(@, arguments)
          catch e
            ## add reason hidden unless we expect the element to be hidden
            if (e.message or "").indexOf("not to be") is -1
              reason = $Dom.getReasonElIsHidden(@_obj)
              e.message += "\n\n" + reason
            throw e

      chai.Assertion.overwriteProperty "exist", (_super) ->
        return ->
          cy = _this.Cypress.cy

          obj = @_obj

          if not cy or not ($Utils.isInstanceOf(obj, $) or $Utils.hasElement(obj))
            try
              _super.apply(@, arguments)
            catch e
              e.type = "existence"
              throw e
          else
            if not obj.length
              @_obj = null

            node = if obj and obj.length then $Utils.stringifyElement(obj, "short") else obj.selector

            try
              @assert(
                isContained = cy._contains(obj),
                "expected \#{act} to exist in the DOM",
                "expected \#{act} not to exist in the DOM",
                node,
                node
              )
            catch e1
              e1.node = node
              e1.negated = utils.flag(@, "negate")
              e1.type = "existence"

              getLongExistsMessage = (obj) ->
                ## if we expected not for an element to exist
                if isContained
                  "Expected #{node} not to exist in the DOM, but it was continuously found."
                else
                  "Expected to find element: '#{obj.selector}', but never found it."

              e1.displayMessage = getLongExistsMessage(obj)
              throw e1

    listeners: ->
      @listenTo @Cypress, "stop", => @stop()

      return @

    stop: ->
      @stopListening()
      @restore()
      @Cypress.chai = null
      return @

    restore: ->
      chai.expect = expect
      chai.assert = assert
      @restoreAsserts()

      return @

    override: ->
      originals = {expect: expect, assert: assert}
      _.each originals, @patchMethod

      @patchAssert()

      return @

    restoreAsserts: ->
      utils.getMessage = getMessage

      chai.Assertion::assert = assertProto
      chai.Assertion::match = matchProto
      chai.Assertion::__methods.length.method = lengthProto
      chai.Assertion::__methods.contain.method = containProto

      Object.defineProperty(chai.Assertion::, "exist", {get: existProto})
      Object.defineProperty(chai.Assertion::, "visible", {get: visibleProto})

    patchAssert: ->
      _this = @

      chai.Assertion::assert = _.wrap assertProto, (orig, args...) ->
        passed    = utils.test(@, args)
        value     = utils.flag(@, "object")
        expected  = args[3]

        customArgs = _this.replaceArgMessages(args, @_obj)

        message   = utils.getMessage(@, customArgs)
        actual    = utils.getActual(@, customArgs)

        ## remove any single quotes between our **, preserving escaped quotes
        ## and if an empty string, put the quotes back
        message = message.replace /\*\*.*\*\*/, (match) ->
          match
            .replace(allEscapedSingleQuotes, "__quote__") # preserve escaped quotes
            .replace(allSingleQuotes, "")
            .replace(allQuoteMarkers, "'") ## put escaped quotes back
            .replace(allQuadStars, "**''**") ## fix empty strings that end up as ****

        try
          orig.apply(@, args)
        catch e
          error = e

        _this.Cypress.trigger "assert", passed, message, value, actual, expected, error

        throw(error) if error

      return @

    replaceArgMessages: (args, str) ->
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

    patchMethod: (value, key) ->
      chai[key] = _.wrap value, (orig, args...) ->

        args = _.map args, (arg) ->
          ## if the object in the arguments has a cypress namespace
          ## then swap it out for that object
          if obj = $Utils.getCypressNamespace(arg)
            return obj

          return arg

        orig.apply(@, args)

      return @

    _.extend $Chai.prototype, Backbone.Events

    @expect = -> chai.expect.apply(chai, arguments)

    @setGlobals = (contentWindow) ->
      contentWindow.chai           = chai
      contentWindow.expect         = chai.expect
      contentWindow.expectOriginal = expect
      # contentWindow.should         = chai.should()
      contentWindow.assert         = chai.assert
      contentWindow.assertOriginal = assert

    @use = chai.use.bind(chai)

    @create = (Cypress, specWindow) ->
      ## clear out existing listeners
      ## if we already exist!
      if existing = Cypress.chai
        existing.stopListening()

      Cypress.chai = new $Chai Cypress, specWindow

  $ChaiRef = $Chai

module.exports = $ChaiRef
