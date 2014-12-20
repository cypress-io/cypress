do (Cypress, _) ->

  proxies = "find each map filter children eq closest first last next parent parents prev siblings".split(" ")

  _.each proxies, (proxy) ->
    Cypress.add proxy, (args...) ->
      subject = @_ensureDomSubject()

      subject[proxy].apply(subject, args)