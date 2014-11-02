## attach to Eclectus global

Eclectus.LocalStorage = do ($, _, Eclectus) ->

  eclRegExp = /^ecl-/

  specialKeywords = /(debug)/

  class LocalStorage extends Eclectus.Command
    config:
      type: "localStorage"

    initialize: ->
      @canBeParent = false

    clear: (keys) ->
      ## make sure we always have an array here
      keys = [].concat(keys)

      ## we have to iterate over both our remoteIframes localStorage
      ## and our window localStorage to remove items from it
      ## due to a bug in IE that does not properly propogate
      ## changes to an iframes localStorage
      _.each [@$remoteIframe.prop("contentWindow").localStorage, localStorage], (storage) =>

        _.chain(storage)
        .keys()
        .reject(@_isSpecialKeyword)
        .reject(@_isEclectusItem)
        .each (item) =>
          if keys.length
            @_ifItemMatchesAnyKey item, keys, (key) =>
              @_removeItem(storage, key)
          else
            @_removeItem(storage, item)

      @emit
        method: "clear"
        message: keys.join(", ")

    _removeItem: (storage, item) ->
      storage.removeItem(item)

    _isSpecialKeyword: (item) ->
      specialKeywords.test item

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
      for key in keys
        re = @_normalizeRegExpOrString(key)

        return fn(item) if re.test(item)

  return LocalStorage