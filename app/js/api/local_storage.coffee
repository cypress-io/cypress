## attach to Eclectus global

Eclectus.LocalStorage = do ($, _, Eclectus) ->

  eclRegExp = /^ecl-/

  class LocalStorage extends Eclectus.Command
    config:
      type: "localStorage"

    initialize: ->
      @canBeParent = false

    clear: (keys) ->
      ## make sure we always have an array here
      keys = [].concat(keys)

      _.chain(localStorage).keys().each (item) =>
        ## dont remove any eclectus items
        return if @_isEclectusItem(item)

        if keys.length
          @_ifItemMatchesAnyKey item, keys, (key) =>
            @_removeItem(key)
        else
          @_removeItem(item)

      @emit
        method: "clear"
        message: keys.join(", ")

    _removeItem: (item) ->
      localStorage.removeItem(item)

    _isEclectusItem: (item) ->
      eclRegExp.test item

    _normalizeRegExpOrString: (key) ->
      switch
        when _.isRegExp(key) then key
        when _.isString(key) then new RegExp("^" + key + "$")
        else
          throw new Error("Arguments to Ecl.clear() must be a regular expression or string!")

    ## if item matches by string or regex
    ## any key in our keys then callback
    _ifItemMatchesAnyKey: (item, keys, fn) ->
      _.any keys, (key) =>
        re = @_normalizeRegExpOrString(key)

        fn(item) if re.test(item)

  return LocalStorage