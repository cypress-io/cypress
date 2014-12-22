do (Cypress, _) ->

  proxies = "find each map filter children eq closest first last next parent parents prev siblings".split(" ")

  _.each proxies, (proxy) ->
    Cypress.addModifier proxy, (args...) ->
      subject = @_ensureDomSubject()

      ## instead of applying directly to the subject
      ## shouldnt modifiers go through the same logic
      ## as #get where we potentially retry several times?
      subject[proxy].apply(subject, args)