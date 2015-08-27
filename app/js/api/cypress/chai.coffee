do ($Cypress, _, chai) ->

  ## all words between single quotes which are at
  ## the end of the string
  allPropertyWordsBetweenSingleQuotes = /('.*?')$/g

  ## grab all words between single quotes except
  ## when the single quote word is the LAST word
  allWordsBetweenSingleQuotes = /('.*?')(.+)/g

  allWordsBetweenCurlyBraces  = /(#{.+?})/g

  chai.use (chai, utils) ->

    expect       = chai.expect
    assert       = chai.assert
    assertProto  = chai.Assertion::assert

    class $Chai
      constructor: (@Cypress, specWindow) ->
        @override()
        @listeners()

        $Chai.setGlobals(specWindow)
        @addCustomProperties()

      addCustomProperties: ->
        _this = @

              ## filter out anything not currently in our document
              if not cy._contains(obj)
                obj = @_obj = obj.filter (index, el) ->
                  cy._contains(el)

              node = if obj and obj.length then $Cypress.Utils.stringifyElement(obj, "short") else obj.selector

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
                if _.isFinite(length)
                  return throw e1

                e2 = cy.cypressErr("You must provide a valid number to a length assertion. You passed: '#{length}'")
                e2.retry = false
                throw e2

          fn2 = (_super) ->
            return ->
              _super.apply(@, arguments)

          fn1, fn2
        ## I dont like directly talking to cy here and directly
        ## calling the _contains method but I don't know of another
        ## way to do this, since we need to talk to the remoteDocument
        chai.Assertion.addProperty "existInDocument", ->
          if not cy = _this.Cypress.cy
            throw new Error("cy must be running to use this assertion.")

          obj = @_obj

          @assert(
            cy._contains(obj),
            "expected #{utils.inspect(obj.selector)} to exist in the document",
            "expected #{utils.inspect(obj.selector)} not to exist in the document"
          )

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
        @restoreAssert()

        return @

      override: ->
        originals = {expect: expect, assert: assert}
        _.each originals, @patchMethod

        @patchAssert()

        return @

      restoreAssert: ->
        delete chai.Assertion::existInDocument
        chai.Assertion::assert = assertProto

      patchAssert: ->
        _this = @

        chai.Assertion::assert = _.wrap assertProto, (orig, args...) ->
          ## we only want to shift the arguments and send these
          ## off to Ecl.assert if it exists (which it wont in our
          ## own test mode)

          passed    = utils.test(@, args)
          value     = utils.flag(@, "object")
          expected  = args[3]

          ## if our value is an element based
          ## value, then use its selector else
          ## build the string from the element itself

          ## if value is element like in any way
          ## we need to stringify it, and we may also
          ## need to override the args because chai-jquery
          ## does not properly handle .exist methods because
          ## it already uses obj.selector (which it may not have)
          if $Cypress.Utils.hasElement(value)
            @_obj = $Cypress.Utils.stringifyElement(value, "short")

          customArgs = _this.replaceArgMessages(args, @_obj)

          message   = utils.getMessage(@, customArgs)

          ## remove any single quotes between our [b] tags
          # message = message.replace /(\[b\])(.+)(\[\\b\])/, (match, b1, word, b2) ->
          message = message.replace /\[b\].*\[\\b\]/, (match) ->
            match.replace(/'/g, "")

          ## reset the obj to the old value
          ## if it was mutated
          @_obj = value if @_obj isnt value

          actual    = utils.getActual(@, customArgs)

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
              .replace(allWordsBetweenCurlyBraces,          "[b]$1[\\b]")
              .replace(allWordsBetweenSingleQuotes,         "[b]#{str}[\\b]$2")
              .replace(allPropertyWordsBetweenSingleQuotes, "[b]$1[\\b]")
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
            if obj = $Cypress.Utils.getCypressNamespace(arg)
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

      @create = (Cypress, specWindow) ->
        ## clear out existing listeners
        ## if we already exist!
        if existing = Cypress.chai
          existing.stopListening()

        Cypress.chai = new $Chai Cypress, specWindow

    $Cypress.Chai = $Chai