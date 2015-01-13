## attach to Cypress global

do (Cypress, _, chai) ->

  chai.use (chai, utils) ->

    expect       = chai.expect
    assert       = chai.assert
    assertProto  = chai.Assertion::assert

    Cypress.Chai = {
      expect: -> chai.expect.apply(chai, arguments)

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

      setGlobals: (contentWindow) ->
        contentWindow.chai           = chai
        contentWindow.expect         = chai.expect
        contentWindow.expectOriginal = expect
        contentWindow.should         = chai.should()
        contentWindow.assert         = chai.assert
        contentWindow.assertOriginal = assert

      restoreAssert: ->
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
          if Cypress.Utils.hasElement(value)
            @_obj = Cypress.Utils.stringifyElement(value, "short")

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

          Cypress.assert passed, message, value, actual, expected, error

          throw(error) if error

        return @

      replaceArgMessages: (args, str) ->
        _.reduce args, (memo, value, index) =>
          if _.isString(value)
            value = value
              .replace(/('.*?')/g, "[b]#{str}[\\b]")
              .replace(/(#{.+?})/g, "[b]$1[\\b]")
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
            if obj = Cypress.Utils.getCypressNamespace(arg)
              return obj

            return arg

          orig.apply(@, args)

        return @
    }