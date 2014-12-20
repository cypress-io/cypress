do (Cypress, _) ->

  Cypress.utils =
    stringifyElement: (el) ->
      el = if _.isElement(el) then $(el) else el
      el.clone().empty().prop("outerHTML")

    plural: (obj, plural, singular) ->
      obj = if _.isNumber(obj) then obj else obj.length
      if obj > 1 then plural else singular