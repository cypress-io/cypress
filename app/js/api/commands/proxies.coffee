do (Cypress, _) ->

  proxies = "find each map filter children eq closest first last next parent parents prev siblings".split(" ")

  _.each proxies, (proxy) ->
    Cypress.addChildCommand proxy, (subject, args...) ->
      @ensureDom(subject)

      ## instead of applying directly to the subject
      ## shouldnt modifiers go through the same logic
      ## as #get where we potentially retry several times?
      $el = subject[proxy].apply(subject, args)

      Cypress.command
        $el: $el
        onConsole: ->
          "Selector":     args.join(", ")
          "Applied To":   subject
          "Returned":     $el
          "Elements":     $el.length

      return $el