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
          @_ifItemStartsWithAnyKey item, keys, (key) =>
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

    ## if any key in the array of keys
    ## matches the dynamic regexp of the item
    ## then we callback the fn
    _ifItemStartsWithAnyKey: (item, keys, fn) ->
      _.any keys, (key) ->
        re = new RegExp("^" + key)

        fn(item) if re.test(item)

  return LocalStorage