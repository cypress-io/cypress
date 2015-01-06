do (Cypress, _) ->

  Cypress.addUtil
    hasElement: (obj) ->
      !!(obj and obj[0] and _.isElement(obj[0])) or _.isElement(obj)

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