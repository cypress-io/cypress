## attach to Cypress global

do (Cypress, _, chai) ->

  chai.use (chai, utils) ->

    expect       = chai.expect
    assert       = chai.assert
    assertProto  = chai.Assertion::assert

    Cypress.Chai = {
      restore: ->
        chai.expect = expect
        chai.assert = assert
        chai.Assertion::assert = assertProto

        return @

      override: ->
        originals = {expect: expect, assert: assert}
        _.each originals, @patchMethod

        @patchAssert()

        return @

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

          args = _this.replaceArgMessages(args, @_obj)

          message   = utils.getMessage(@, args)

          ## remove any single quotes between our [b] tags
          # message = message.replace /(\[b\])(.+)(\[\\b\])/, (match, b1, word, b2) ->
          message = message.replace /\[b\].*\[\\b\]/, (match) ->
            match.replace(/'/g, "")

          ## reset the obj to the old value
          ## if it was mutated
          @_obj = value if @_obj isnt value

          actual    = utils.getActual(@, args)

          Cypress.assert passed, message, value, actual, expected

          orig.apply(@, args)

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

          try
            switch
              ## shift the expectation to use the $el on
              ## the command
              when args[0] and args[0].isCommand?()
                args[0] = args[0]._$el

              ## chai-jquery hard codes checking instanceof's
              ## and would always return false if we're receiving
              ## a child jQuery object -- so we need to reset
              ## this object to a jQuery instance that the parent
              ## window controls
              when args[0] instanceof $("iframe#iframe-remote")[0]?.contentWindow.$
                args[0] = $(args[0])
          catch e

          orig.apply(@, args)

        return @
    }