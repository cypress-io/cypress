$Cypress.Utils = do ($Cypress, _) ->

  tagOpen     = /\[([a-z\s='"-]+)\]/g
  tagClosed   = /\[\/([a-z]+)\]/g

  CYPRESS_OBJECT_NAMESPACE = "_cypressObj"

  return {
    ## return a new object if the obj
    ## contains the properties of filter
    ## and the values are different
    filterDelta: (obj, filter) ->
      obj = _.reduce filter, (memo, value, key) ->
        if obj[key] isnt value
          memo[key] = obj[key]

        memo
      , {}

      if _.isEmpty(obj) then undefined else obj

    _stringifyObj: (obj) ->
      ## underscore shits the bed if our object has a 'length'
      ## property so we have to normalize that
      if _(obj).has("length")
        obj.Length = obj.length
        delete obj.length

      str = _.reduce obj, (memo, value, key) =>
        memo.push key.toLowerCase() + ": " + @_stringify(value)
        memo
      , []

      "{" + str.join(", ") + "}"

    _stringify: (value) ->
      switch
        when @hasElement(value)
          @stringifyElement(value, "short")

        when _.isFunction(value)
          "function(){}"

        when _.isArray(value)
          len = value.length
          if len > 3
            "Array[#{len}]"
          else
            "[" + _.map(value, _.bind(@_stringify, @)).join(", ") + "]"

        when _.isObject(value)
          len = _.keys(value).length
          if len > 2
            "Object{#{len}}"
          else
            @_stringifyObj(value)

        when _.isUndefined(value)
          undefined

        else
          "" + value

    stringify: (values) ->
      ## if we already have an array
      ## then nest it again so that
      ## its formatted properly
      values = [].concat(values)

      _.chain(values)
        .map(_.bind(@_stringify, @))
          .without(undefined)
            .value()
              .join(", ")

    hasElement: (obj) ->
      try
        !!(obj and obj[0] and _.isElement(obj[0])) or _.isElement(obj)
      catch
        false

    ## short form css-inlines the element
    ## long form returns the outerHTML
    stringifyElement: (el, form = "long") ->
      el = if _.isElement(el) then $(el) else el

      switch form
        when "long"
          el.clone().empty().prop("outerHTML")
        when "short"
          str = el.prop("tagName").toLowerCase()
          if id = el.prop("id")
            str += "#" + id

          if klass = el.prop("class")
            str += "." + klass.split(/\s+/).join(".")

          "<#{str}>"

    plural: (obj, plural, singular) ->
      obj = if _.isNumber(obj) then obj else obj.length
      if obj > 1 then plural else singular

    convertHtmlTags: (html) ->
      html
        .replace(tagOpen, "<$1>")
        .replace(tagClosed, "</$1>")

    isInstanceOf: (instance, constructor) ->
      try
        instance instanceof constructor
      catch e
        false

    getCypressNamespace: (obj) ->
      obj and obj[CYPRESS_OBJECT_NAMESPACE]

    ## backs up an original object to another
    ## by going through the cypress object namespace
    setCypressNamespace: (obj, original) ->
      obj[CYPRESS_OBJECT_NAMESPACE] = original
  }